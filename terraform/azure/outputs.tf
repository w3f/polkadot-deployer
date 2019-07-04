output "kubeconfig" {
  value = azurerm_kubernetes_cluster.polkadot.kube_config_raw
  sensitive = true
}
