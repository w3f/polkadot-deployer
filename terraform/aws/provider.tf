provider "aws" {
  region = "{{ location }}"
}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {}
