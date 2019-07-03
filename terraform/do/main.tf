resource "digitalocean_tag" "expose-p2p" {
  name = "expose-p2p"
}

resource "digitalocean_kubernetes_cluster" "primary" {
  name    = var.cluster_name
  region  = var.location
  version = var.k8s_version
  provider = "digitalocean"

  node_pool {
    name       = "node-pool"
    size       = var.machine_type
    node_count = var.node_count
    tags = ["${digitalocean_tag.expose-p2p.id}"]
  }
}

resource "digitalocean_firewall" "fw-p2p" {
  name = "fw-p2p"
  tags = ["${digitalocean_tag.expose-p2p.id}"]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "30100-30200"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
}
