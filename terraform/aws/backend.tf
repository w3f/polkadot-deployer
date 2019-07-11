provider "google" {
  project     = "{{ projectID }}"
  credentials = "{{ credentials.gcp }}"
}

terraform {
  backend "gcs" {
    bucket  = "pd-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/{{ clusterName }}"
  }
}
