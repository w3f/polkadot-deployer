resource "azurerm_resource_group" "polkadot-{{ clusterName }}" {
  name     = "polkadot-{{ clusterName }}"
  location = var.location
}

resource "azurerm_kubernetes_cluster" "polkadot-{{ clusterName }}" {
  name                = var.cluster_name
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  dns_prefix          = "polkadot-{{ clusterName }}"
  kubernetes_version  = var.k8s_version

  network_profile {
    network_plugin = "kubenet"
    network_policy = "calico"
  }

  default_node_pool {
    name            = "default"
    node_count      = var.node_count
    vm_size         = var.machine_type
    os_disk_size_gb = 30
    type            = "AvailabilitySet"
  }

  service_principal {
    client_id     = var.client_id
    client_secret = var.client_secret
  }

  enable_pod_security_policy = false
}

resource "azurerm_virtual_network" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  address_space       = ["10.0.0.0/16"]
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
}

resource "azurerm_subnet" "polkadot-{{ clusterName }}" {
  name                      = "polkadot-{{ clusterName }}"
  resource_group_name       = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  virtual_network_name      = "${azurerm_virtual_network.polkadot-{{ clusterName }}.name}"
  address_prefix            = "10.0.1.0/24"
}

resource "azurerm_network_security_group" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
}

resource "azurerm_network_security_rule" "outbound" {
  name                        = "outbound"
  priority                    = 100
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  network_security_group_name = "${azurerm_network_security_group.polkadot-{{ clusterName }}.name}"
}

resource "azurerm_network_security_rule" "p2p" {
  name                        = "p2p"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "30100-30101"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  network_security_group_name = "${azurerm_network_security_group.polkadot-{{ clusterName }}.name}"
}

resource "azurerm_subnet_network_security_group_association" "polkadot-{{ clusterName }}" {
  subnet_id                 = "${azurerm_subnet.polkadot-{{ clusterName }}.id}"
  network_security_group_id = "${azurerm_network_security_group.polkadot-{{ clusterName }}.id}"
}
