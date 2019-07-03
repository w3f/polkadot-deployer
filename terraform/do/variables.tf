variable "do_token" {}

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
  default = "s-4vcpu-8gb"
}

variable "k8s_version" {
  default = "1.13.5-do.5"
}
