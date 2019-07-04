terraform {
  backend "gcs" {
    bucket  = "pd-gcp-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/{{ clusterName }}"
  }
}
