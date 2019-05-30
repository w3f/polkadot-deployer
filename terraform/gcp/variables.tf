variable "cluster_name" {
  default = "polkadot-deployer"
}

variable "location" {
  default = "{{ location }}"
}

variable "node_count" {
  default = 2
}

variable "machine_type" {
  default = "n1-standard-2"
}

variable "k8s_version" {
  default = "1.13.6-gke.0"
}
