resource "azurerm_resource_group" "polkadot" {
  name     = "polkadot"
  location = var.location
}

resource "azurerm_kubernetes_cluster" "polkadot" {
  name                = var.cluster_name
  location            = "${azurerm_resource_group.polkadot.location}"
  resource_group_name = "${azurerm_resource_group.polkadot.name}"
  dns_prefix          = "polkadot"
  kubernetes_version  = var.k8s_version

  agent_pool_profile {
    name            = "default"
    count           = var.node_count
    vm_size         = var.machine_type
    os_type         = "Linux"
    os_disk_size_gb = 30
  }

  service_principal {
    client_id     = var.client_id
    client_secret = var.client_secret
  }
}
