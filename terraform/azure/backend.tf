provider "google" {
  project     = "{{ projectID }}"
  credentials = "{{ credentials.gcp }}"
}

terraform {
  backend "gcs" {
    bucket  = "azure-pd-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/azure-{{ deploymentName }}-{{ clusterName }}"
  }
}
