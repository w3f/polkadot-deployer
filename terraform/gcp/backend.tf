terraform {
  backend "gcs" {
    bucket  = "gcp-pd-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/gcp-{{ deploymentName }}-{{ clusterName }}"
  }
}
