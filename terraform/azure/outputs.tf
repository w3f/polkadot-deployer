output "kubeconfig" {
  value = azurerm_kubernetes_cluster.polkadot-{{ clusterName }}.kube_config_raw
  sensitive = true
}
