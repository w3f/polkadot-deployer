data "template_file" "kubeconfig" {
  template = "${file("./templates/kubeconfig.tpl")}"
  vars {
    endpoint = "${google_container_cluster.primary.endpoint}"
    cluster_name = "${var.cluster_name}"
    cluster_ca = "${google_container_cluster.primary.master_auth.0.cluster_ca_certificate}"
    client_cert = "${google_container_cluster.primary.master_auth.0.client_certificate}"
    client_cert_key = "${google_container_cluster.primary.master_auth.0.client_key}"
  }
}

output "kubeconfig" {
  value = "${data.template_file.kubeconfig.rendered}"
  sensitive = true
}
