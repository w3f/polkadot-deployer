resource "digitalocean_kubernetes_cluster" "primary" {
  name    = var.cluster_name
  region  = var.location
  version = var.k8s_version
  provider = "digitalocean"

  node_pool {
    name       = "node-pool"
    size       = var.machine_type
    node_count = var.node_count
  }
}
