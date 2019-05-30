apiVersion: v1
kind: Config
preferences:
  colors: true
current-context: polkadot-benchmarks
contexts:
- context:
    cluster: ${cluster_name}
    namespace: default
    user: polkadot-benchmarks
  name: polkadot-benchmarks
clusters:
- cluster:
    server: https://${endpoint}
    certificate-authority-data: ${cluster_ca}
  name: ${cluster_name}
users:
- name: polkadot-benchmarks
  user:
    client-certificate-data: ${client_cert}
    client-key-data: ${client_cert_key}
