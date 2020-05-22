data "aws_region" "current" {}

data "aws_availability_zones" "available" {}

resource "aws_iam_role" "polkadot-{{ clusterName }}" {
  name = "terraform-eks-polkadot-{{ clusterName }}"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "polkadot-AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-AmazonEKSServicePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}.name}"
}

resource "aws_security_group" "polkadot" {
  name        = "terraform-eks-polkadot"
  description = "Cluster communication with worker nodes"
  vpc_id      = aws_vpc.polkadot.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "terraform-eks-polkadot"
  }
}

resource "aws_vpc" "polkadot" {
  cidr_block = "10.0.0.0/16"

  tags = "${
    map(
     "Name", "terraform-eks-polkadot-node",
     "kubernetes.io/cluster/${var.cluster_name}", "shared",
    )
  }"
}

resource "aws_subnet" "polkadot" {
  count = 2

  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = "10.0.${count.index}.0/24"
  vpc_id            = aws_vpc.polkadot.id

  tags = "${
    map(
     "Name", "terraform-eks-polkadot-node",
     "kubernetes.io/cluster/${var.cluster_name}", "shared",
    )
  }"
}

resource "aws_internet_gateway" "polkadot" {
  vpc_id = aws_vpc.polkadot.id

  tags = {
    Name = "terraform-eks-polkadot"
  }
}

resource "aws_route_table" "polkadot" {
  vpc_id = aws_vpc.polkadot.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.polkadot.id
  }
}

resource "aws_route_table_association" "polkadot" {
  count = 2

  subnet_id      = aws_subnet.polkadot.*.id[count.index]
  route_table_id = aws_route_table.polkadot.id
}

resource "aws_security_group_rule" "node_ingress_cluster_https" {
  description              = "Allow incoming https connections from the EKS masters security group"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.polkadot-node.id
  source_security_group_id = aws_security_group.polkadot.id
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-ingress-node-https" {
  description              = "Allow pods to communicate with the cluster API Server"
  from_port                = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.polkadot.id
  source_security_group_id = aws_security_group.polkadot-node.id
  to_port                  = 443
  type                     = "ingress"
}

resource "aws_eks_cluster" "polkadot" {
  name     = var.cluster_name
  role_arn = "${aws_iam_role.polkadot-{{ clusterName }}.arn}"
  version = var.k8s_version

  vpc_config {
    security_group_ids = ["${aws_security_group.polkadot.id}"]
    subnet_ids         = flatten(["${aws_subnet.polkadot.*.id}"])
  }

  depends_on = [
    "aws_iam_role_policy_attachment.polkadot-AmazonEKSClusterPolicy",
    "aws_iam_role_policy_attachment.polkadot-AmazonEKSServicePolicy",
  ]
}

resource "aws_iam_role" "polkadot-{{ clusterName }}-node" {
  name = "terraform-eks-polkadot-{{ clusterName }}-node"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "polkadot-{{ clusterName }}-node-autoscaling" {
  name        = "terraform-eks-polkadot-{{ clusterName }}-node-autoscaling"
  description = "Node policy to allow autoscaling."

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "polkadot-node-autoscaling" {
  policy_arn = "${aws_iam_policy.polkadot-{{ clusterName }}-node-autoscaling.arn}"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}-node.name}"
}

resource "aws_iam_instance_profile" "polkadot-{{ clusterName }}-node" {
  name = "terraform-eks-polkadot-{{ clusterName }}"
  role = "${aws_iam_role.polkadot-{{ clusterName }}-node.name}"
}

resource "aws_security_group" "polkadot-node" {
  name        = "terraform-eks-polkadot-node"
  description = "Security group for all nodes in the cluster"
  vpc_id      = aws_vpc.polkadot.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = "${
    map(
     "Name", "terraform-eks-polkadot-node",
     "kubernetes.io/cluster/${var.cluster_name}", "owned",
    )
  }"
}

resource "aws_security_group_rule" "polkadot-node-ingress-self" {
  description              = "Allow node to communicate with each other"
  from_port                = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.polkadot-node.id
  source_security_group_id = aws_security_group.polkadot-node.id
  to_port                  = 65535
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-node-ingress-cluster" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  from_port                = 1025
  protocol                 = "tcp"
  security_group_id        = aws_security_group.polkadot-node.id
  source_security_group_id = aws_security_group.polkadot.id
  to_port                  = 65535
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-node-ingress-p2p" {
  description              = "Allow connection to p2p ports from outside the cluster"
  from_port                = 30100
  protocol                 = "tcp"
  security_group_id        = aws_security_group.polkadot-node.id
  cidr_blocks              = ["0.0.0.0/0"]
  to_port                  = 30101
  type                     = "ingress"
}

resource "aws_network_acl" "polkadot-acl" {
  vpc_id = "${aws_vpc.polkadot.id}"

  // deny access to AWS Instance Metadata API
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "deny"
    cidr_block = "169.254.169.254/32"
    from_port  = 80
    to_port    = 80
  }

  tags = "${
    map(
     "Name", "terraform-eks-polkadot-node",
     "kubernetes.io/cluster/${var.cluster_name}", "owned",
    )
  }"
}

data "aws_ami" "eks-worker" {
  filter {
    name   = "name"
    values = ["amazon-eks-node-${aws_eks_cluster.polkadot.version}-v*"]
  }

  most_recent = true
  owners      = ["602401143452"] # Amazon Account ID
}

locals {
  polkadot-node-userdata = <<USERDATA
#!/bin/bash
set -o xtrace
/etc/eks/bootstrap.sh --apiserver-endpoint '${aws_eks_cluster.polkadot.endpoint}' --b64-cluster-ca '${aws_eks_cluster.polkadot.certificate_authority.0.data}' '${var.cluster_name}'
USERDATA
}

resource "aws_launch_configuration" "polkadot" {
  associate_public_ip_address = true
  iam_instance_profile        = "${aws_iam_instance_profile.polkadot-{{ clusterName }}-node.name}"
  image_id                    = data.aws_ami.eks-worker.id
  instance_type               = var.machine_type
  name_prefix                 = "terraform-eks-polkadot"
  security_groups             = [aws_security_group.polkadot-node.id]
  user_data_base64            = "${base64encode(local.polkadot-node-userdata)}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "polkadot" {
  desired_capacity     = var.node_count
  launch_configuration = aws_launch_configuration.polkadot.id
  max_size             = 32
  min_size             = 1
  name                 = "terraform-eks-polkadot-{{ clusterName }}"
  vpc_zone_identifier  = flatten(["${aws_subnet.polkadot.*.id}"])

  tag {
    key                 = "Name"
    value               = "terraform-eks-polkadot-{{ clusterName }}"
    propagate_at_launch = true
  }

  tag {
    key                 = "kubernetes.io/cluster/${var.cluster_name}"
    value               = "owned"
    propagate_at_launch = true
  }
}

resource "null_resource" "apply_auth_cm" {
  provisioner "local-exec" {
    command = <<EOT
sleep 10

echo "${local.config_map_aws_auth}" > cm.yaml
echo "${local.kubeconfig}" > kubeconfig

kubectl apply -f ./cm.yaml

kubectl delete psp eks.privileged

kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/release-1.5/config/v1.5/calico.yaml

kubectl -n kube-system get cm kube-proxy-config -o yaml |sed 's/metricsBindAddress: 127.0.0.1:10249/metricsBindAddress: 0.0.0.0:10249/' | kubectl apply -f -
kubectl -n kube-system patch ds kube-proxy -p "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"updateTime\":\"`date +'%s'`\"}}}}}"

rm -f kubeconfig
EOT
    environment = {
      KUBECONFIG="./kubeconfig"
    }
  }

  depends_on = [
    aws_autoscaling_group.polkadot
  ]
}
