data "template_file" "kubeconfig" {
  template = file("${path.module}/templates/kubeconfig.tpl")

  vars = {
    cluster_name    = google_container_cluster.primary.name
    user_name       = google_container_cluster.primary.master_auth.0.username
    user_password   = google_container_cluster.primary.master_auth.0.password
    endpoint        = google_container_cluster.primary.endpoint
    cluster_ca      = google_container_cluster.primary.master_auth.0.cluster_ca_certificate
    client_cert     = google_container_cluster.primary.master_auth.0.client_certificate
    client_cert_key = google_container_cluster.primary.master_auth.0.client_key
  }
}

output "kubeconfig" {
  value = data.template_file.kubeconfig.rendered
  sensitive = true
}
