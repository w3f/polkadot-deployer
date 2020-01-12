locals {
  config_map_aws_auth = <<CONFIGMAPAWSAUTH
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapRoles: |
    - rolearn: arn:aws:iam::{{ awsAccountId }}:role/terraform-eks-polkadot-{{ clusterName }}-node
      username: system:node:{{{{raw}}}}{{EC2PrivateDNSName}}{{{{/raw}}}}
      groups:
        - system:bootstrappers
        - system:nodes
CONFIGMAPAWSAUTH

  kubeconfig = <<KUBECONFIG
apiVersion: v1
clusters:
- cluster:
    server: ${aws_eks_cluster.polkadot.endpoint}
    certificate-authority-data: ${aws_eks_cluster.polkadot.certificate_authority.0.data}
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: aws
  name: aws
current-context: aws
kind: Config
preferences: {}
users:
- name: aws
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1alpha1
      command: aws-iam-authenticator
      args:
        - "token"
        - "-i"
        - "${var.cluster_name}"
KUBECONFIG
}

output "config_map_aws_auth" {
  value = "${local.config_map_aws_auth}"
  sensitive = true
}

output "kubeconfig" {
  value = "${local.kubeconfig}"
  sensitive = true
}
