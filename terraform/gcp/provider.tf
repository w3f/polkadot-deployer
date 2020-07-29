provider "google" {
  project     = "{{ projectID }}"
  version     = "~>2.16"
}

provider "google-beta" {
  project     = "{{ projectID }}"
  version     = "~>2.16"
}

provider "template" {
  version     = "~>2.1"
}
