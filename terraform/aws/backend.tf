provider "google" {
  project     = "{{ projectID }}"
  credentials = "{{ credentials.gcp }}"
}

terraform {
  backend "gcs" {
    bucket  = "aws-pd-tf-state-{{ deploymentName }}"
    prefix  = "terraform/state/aws-{{ clusterName }}"
  }
}
