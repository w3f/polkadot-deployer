provider "google" {
  project     = "{{ projectID }}"
  region      = "{{ region }}"
  credentials = "{{ credentials.gcp }}"
}
