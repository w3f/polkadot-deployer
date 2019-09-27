provider "google" {
  project     = "{{ projectID }}"
  version     = "~>2.16"
}

provider "random" {
  version     = "~>2.2"
}

provider "template" {
  version     = "~>2.1"
}
