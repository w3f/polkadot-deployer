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
  default = "{{#if machineType }}{{ machineType}}{{ else }}s-4vcpu-8gb{{/if}}"
}

variable "k8s_version" {
  default = "1.14.3-do.0"
}
