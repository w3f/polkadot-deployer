variable "cluster_name" {
  default = "polkadot-deployer"
}

variable "region" {
  default = "{{ region }}"
}

variable "node_count" {
  default = 2
}

variable "machine_type" {
  default = "n1-standard-2"
}
