provider "google" {
  project     = "{{ projectID }}"
  credentials = "{{ credentials.gcp }}"
}

resource "google_storage_bucket" "imagestore" {
  name          = "tf-state-{{ deploymentName }}"
  force_destroy = true
}
