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
  default = "{{#if machineType }}{{ machineType}}{{ else }}m4.large{{/if}}"
}

variable "k8s_version" {
  default = "1.15"
}

variable "image_type" {
  default = "ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"
}

variable "image_owner" {
  default = "099720109477" # Canonical
}
