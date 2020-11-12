provider "google" {
  project     = "{{ projectID }}"
  credentials = "{{ credentials.gcp }}"
  version     = "~>2.16"
}

resource "google_storage_bucket" "imagestore" {
  name          = "aws-pd-tf-state-{{ deploymentName }}"
  force_destroy = true
}
