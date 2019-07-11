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

resource "aws_iam_role_policy_attachment" "polkadot-{{ clusterName }}-AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-{{ clusterName }}-AmazonEKSServicePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = "${aws_iam_role.polkadot-{{ clusterName }}.name}"
}

resource "aws_security_group" "polkadot-{{ clusterName }}" {
  name        = "terraform-eks-polkadot-{{ clusterName }}"
  description = "Cluster communication with worker nodes"
  vpc_id      = "${aws_vpc.polkadot.id}"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name = "terraform-eks-polkadot"
  }
}

resource "aws_security_group_rule" "node_ingress_cluster_https" {
  description              = "Allow incoming https connections from the EKS masters security group"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = "${aws_security_group.polkadot-node.id}"
  source_security_group_id = "${aws_security_group.polkadot-{{ clusterName }}.id}"
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-{{ clusterName }}-ingress-node-https" {
  description              = "Allow pods to communicate with the cluster API Server"
  from_port                = 443
  protocol                 = "tcp"
  security_group_id        = "${aws_security_group.polkadot-{{ clusterName }}.id}"
  source_security_group_id = "${aws_security_group.polkadot-node.id}"
  to_port                  = 443
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-{{ clusterName }}-ingress-workstation-https" {
  cidr_blocks       = ["${local.workstation-external-cidr}"]
  description       = "Allow workstation to communicate with the cluster API Server"
  from_port         = 443
  protocol          = "tcp"
  security_group_id = "${aws_security_group.polkadot-{{ clusterName }}.id}"
  to_port           = 443
  type              = "ingress"
}

resource "aws_eks_cluster" "polkadot-{{ clusterName }}" {
  name     = var.cluster-name
  role_arn = "${aws_iam_role.polkadot-{{ clusterName }}.arn}"

  vpc_config {
    security_group_ids = ["${aws_security_group.polkadot-{{ clusterName }}.id}"]
    subnet_ids         = ["${aws_subnet.polkadot.*.id}"]
  }

  depends_on = [
    "aws_iam_role_policy_attachment.polkadot-{{ clusterName }}-AmazonEKSClusterPolicy",
    "aws_iam_role_policy_attachment.polkadot-{{ clusterName }}-AmazonEKSServicePolicy",
  ]
}

resource "aws_iam_role" "polkadot-node" {
  name = "terraform-eks-polkadot-node"

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

resource "aws_iam_policy" "polkadot-node-autoscaling" {
  name        = "terraform-eks-polkadot-node-autoscaling"
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
  policy_arn = "${aws_iam_policy.polkadot-node-autoscaling.arn}"
  role       = "${aws_iam_role.polkadot-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = "${aws_iam_role.polkadot-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = "${aws_iam_role.polkadot-node.name}"
}

resource "aws_iam_role_policy_attachment" "polkadot-node-AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = "${aws_iam_role.polkadot-node.name}"
}

resource "aws_iam_instance_profile" "polkadot-node" {
  name = "terraform-eks-polkadot"
  role = "${aws_iam_role.polkadot-node.name}"
}

resource "aws_security_group" "polkadot-node" {
  name        = "terraform-eks-polkadot-node"
  description = "Security group for all nodes in the cluster"
  vpc_id      = "${aws_vpc.polkadot.id}"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = "${
    map(
     "Name", "terraform-eks-polkadot-node",
     "kubernetes.io/cluster/${var.cluster-name}", "owned",
    )
  }"
}

resource "aws_security_group_rule" "polkadot-node-ingress-self" {
  description              = "Allow node to communicate with each other"
  from_port                = 0
  protocol                 = "-1"
  security_group_id        = "${aws_security_group.polkadot-node.id}"
  source_security_group_id = "${aws_security_group.polkadot-node.id}"
  to_port                  = 65535
  type                     = "ingress"
}

resource "aws_security_group_rule" "polkadot-node-ingress-cluster" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  from_port                = 1025
  protocol                 = "tcp"
  security_group_id        = "${aws_security_group.polkadot-node.id}"
  source_security_group_id = "${aws_security_group.polkadot-{{ clusterName }}.id}"
  to_port                  = 65535
  type                     = "ingress"
}

data "aws_ami" "eks-worker" {
  filter {
    name   = "name"
    values = ["eks-worker-*"]
  }

  most_recent = true
  owners      = ["602401143452"] # Amazon
}

# EKS currently documents this required userdata for EKS worker nodes to
# properly configure Kubernetes applications on the EC2 instance.
# We utilize a Terraform local here to simplify Base64 encoding this
# information into the AutoScaling Launch Configuration.
# More information: https://amazon-eks.s3-us-west-2.amazonaws.com/1.10.3/2018-06-05/amazon-eks-nodegroup.yaml
locals {
  polkadot-node-userdata = <<USERDATA
#!/bin/bash -xe

CA_CERTIFICATE_DIRECTORY=/etc/kubernetes/pki
CA_CERTIFICATE_FILE_PATH=$CA_CERTIFICATE_DIRECTORY/ca.crt
mkdir -p $CA_CERTIFICATE_DIRECTORY
echo "${aws_eks_cluster.polkadot.certificate_authority.0.data}" | base64 -d >  $CA_CERTIFICATE_FILE_PATH
INTERNAL_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
sed -i s,MASTER_ENDPOINT,${aws_eks_cluster.polkadot.endpoint},g /var/lib/kubelet/kubeconfig
sed -i s,CLUSTER_NAME,${var.cluster-name},g /var/lib/kubelet/kubeconfig
sed -i s,REGION,${data.aws_region.current.name},g /etc/systemd/system/kubelet.service
sed -i s,MAX_PODS,20,g /etc/systemd/system/kubelet.service
sed -i s,MASTER_ENDPOINT,${aws_eks_cluster.polkadot.endpoint},g /etc/systemd/system/kubelet.service
sed -i s,INTERNAL_IP,$INTERNAL_IP,g /etc/systemd/system/kubelet.service
DNS_CLUSTER_IP=10.100.0.10
if [[ $INTERNAL_IP == 10.* ]] ; then DNS_CLUSTER_IP=172.20.0.10; fi
sed -i s,DNS_CLUSTER_IP,$DNS_CLUSTER_IP,g /etc/systemd/system/kubelet.service
sed -i s,CERTIFICATE_AUTHORITY_FILE,$CA_CERTIFICATE_FILE_PATH,g /var/lib/kubelet/kubeconfig
sed -i s,CLIENT_CA_FILE,$CA_CERTIFICATE_FILE_PATH,g  /etc/systemd/system/kubelet.service
systemctl daemon-reload
systemctl restart kubelet
USERDATA
}

resource "aws_key_pair" "polkadot" {
  key_name   = "polkadot-key"
  public_key = "${var.ssh_public_key}"
}

resource "aws_launch_configuration" "polkadot" {
  associate_public_ip_address = true
  iam_instance_profile        = "${aws_iam_instance_profile.polkadot-node.name}"
  image_id                    = "${data.aws_ami.eks-worker.id}"
  instance_type               = "m4.large"
  name_prefix                 = "terraform-eks-polkadot"
  security_groups             = ["${aws_security_group.polkadot-node.id}"]
  user_data_base64            = "${base64encode(local.polkadot-node-userdata)}"
  key_name                    = "${aws_key_pair.polkadot.key_name}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "polkadot" {
  desired_capacity     = "${var.workers}"
  launch_configuration = "${aws_launch_configuration.polkadot.id}"
  max_size             = 32
  min_size             = 1
  name                 = "terraform-eks-polkadot"
  vpc_zone_identifier  = ["${aws_subnet.polkadot.*.id}"]

  tag {
    key                 = "Name"
    value               = "terraform-eks-polkadot"
    propagate_at_launch = true
  }

  tag {
    key                 = "kubernetes.io/cluster/${var.cluster-name}"
    value               = "owned"
    propagate_at_launch = true
  }
}
