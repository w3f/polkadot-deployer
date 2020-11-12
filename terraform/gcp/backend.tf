terraform {
  backend "gcs" {
    bucket  = "pd-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/gcp-{{ deploymentName }}-{{ clusterName }}"
  }
}
