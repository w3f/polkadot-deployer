resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.location

  initial_node_count = var.node_count

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  lifecycle {
    ignore_changes = ["master_auth"]
  }

  node_config {
    preemptible  = false
    machine_type = var.machine_type
    image_type   = var.image_type

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }

  min_master_version = var.k8s_version
  node_version = var.k8s_version

  network = google_compute_network.network.self_link
  subnetwork = google_compute_subnetwork.subnetwork.self_link

  network_policy {
    enabled = true

    provider = "CALICO"
  }
}

resource "google_compute_network" "network" {
  name                    = var.cluster_name
  auto_create_subnetworks = false

}

resource "google_compute_subnetwork" "subnetwork" {
  name          = var.cluster_name
  ip_cidr_range = "10.2.0.0/16"
  network       = google_compute_network.network.self_link
  // get region from zone
  region        = join("-", slice(split("-", var.location), 0, 2))
}

resource "google_compute_firewall" "polkadot" {
  name    = var.cluster_name
  network = google_compute_network.network.self_link

  allow {
    protocol = "tcp"
    ports    = ["30100-30101"]
  }

  source_ranges = ["0.0.0.0/0"]
}
