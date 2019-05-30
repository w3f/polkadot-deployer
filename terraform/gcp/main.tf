resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.location

  initial_node_count = var.node_count

  # Setting an empty username and password explicitly disables basic auth
  master_auth {
    client_certificate_config {
      issue_client_certificate = true
    }
  }

  node_config {
    preemptible  = true
    machine_type = "${var.machine_type}"

    metadata = {
      disable-legacy-endpoints = false
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }

  min_master_version = var.k8s_version
  node_version = var.k8s_version
}
