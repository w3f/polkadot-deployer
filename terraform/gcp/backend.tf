terraform {
  backend "gcs" {
    bucket  = "tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/{{ clusterName }}"
  }
}
