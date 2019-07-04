variable "client_id" {}
variable "client_secret" {}

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
  default = "Standard_D2s_v3"
}

variable "k8s_version" {
  default = "1.14.0"
}
