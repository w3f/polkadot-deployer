apiVersion: v1
kind: Config
preferences:
  colors: true
current-context: polkadot-deployer
contexts:
- context:
    cluster: ${cluster_name}
    namespace: default
    user: ${cluster_name}
  name: polkadot-deployer
clusters:
- cluster:
    server: https://${endpoint}
    certificate-authority-data: ${cluster_ca}
  name: ${cluster_name}
users:
- name: ${cluster_name}
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: ${gcloud_path}
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp