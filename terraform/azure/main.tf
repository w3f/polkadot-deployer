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

resource "azurerm_virtual_network" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  address_space       = ["10.0.0.0/16"]
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
}

resource "azurerm_subnet" "polkadot-{{ clusterName }}" {
  name                 = "polkadot-{{ clusterName }}"
  resource_group_name  = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  virtual_network_name = "${azurerm_virtual_network.polkadot-{{ clusterName }}.name}"
  address_prefix       = "10.0.1.0/24"
}

resource "azurerm_public_ip" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_firewall" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  location            = "${azurerm_resource_group.polkadot-{{ clusterName }}.location}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"

  ip_configuration {
    name                 = "configuration"
    subnet_id            = "${azurerm_subnet.polkadot-{{ clusterName }}.id}"
    public_ip_address_id = "${azurerm_public_ip.polkadot-{{ clusterName }}.id}"
  }
}

resource "azurerm_firewall_network_rule_collection" "polkadot-{{ clusterName }}" {
  name                = "polkadot-{{ clusterName }}"
  azure_firewall_name = "${azurerm_firewall.polkadot-{{ clusterName }}.name}"
  resource_group_name = "${azurerm_resource_group.polkadot-{{ clusterName }}.name}"
  priority            = 100
  action              = "Allow"

  rule {
    name = "testrule"

    source_addresses = [
      "0.0.0.0/0",
    ]

    destination_ports = [
      "30100","30101","30102","30103"
    ]

    destination_addresses = [
      "0.0.0.0/0",
    ]

    protocols = [
      "TCP",
      "UDP",
    ]
  }
}
