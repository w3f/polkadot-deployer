provider "google" {
  project     = "{{ projectID }}"
}

resource "google_storage_bucket" "imagestore" {
  name          = "tf-state-{{ deploymentName }}"
  force_destroy = true
}
