# Threat model

Here we describe some of the attack vectors considered for remote deployments
and what measures have been added to the tool to mitigate them. They are grouped
into four groups:

## Local Key management

### Potential lose of key information

#### Description

After a remote cluster is created, anyone getting information about the keys
used in the nodes can gain control on the associated accounts. All the funds
stored in the accounts can be lost and, if third parties are staking on
validators controlled by these keys, they can lose also funds because of
slashing after bad behaviour.

#### Mitigation

* Do not write any information about keys on disk after remote cluster creation.
* Show account seeds after creation on screen and recommend to store them safely.

### Predictable key derivation paths

#### Description

If anyone reading the code can deduce the derivation paths of the keys generated
then they can gain control over the associated accounts.

#### Mitigation

Keys are regenerated on each deployment from random mnemonics with enough entropy.

## Infrastructure

### SSH keys leakage

#### Description

The SSH keys for accessing infrastructure VMs or containers can be leaked,
allowing attackers to access nodes/containers and gain session key seeds. With
this seeds they can cause slashing to the associated account(s) by misbehaving.

#### Mitigation

The tool doesn't generate any SSH key for accessing the VMs. The containers don't
have an SSH server installed. Instead, we take an immutable infrastruture approach,
with log aggregation and monitoring for getting all the required information about
the system state, and the appropriate automation for reacting after degraded
conditions are detected.

### Exposure of other services

### Description

A malicious actor can gain access to the worker nodes/containers by connecting
to open ports on which other services not related to polkadot are up and
listening.

### Mitigation

* Firewall: in the current development stage (testnet created for benchmarking)
only the websockets-rpc and the p2p ports are accessible from outside the cluster.

* There are no additional services running on the containers or the worker nodes,
other than the polkadot/substrate on the containers and kubernetes related services
on the worker nodes.

## Kubernetes resources security

### Other applications in the cluster cause keys leakage

#### Description

If another applications are iinstalled in the same cluster (monitoring, logging,
etc), security issues with them can compromise the security of the whole cluster,
potentially allowing session key seed disclosure.

#### Mitigation

* Pod security policy definition: we restrict the specification of pods that are
allowed to run on the cluster, preventing privileged pods, privilege scalation,
run as root, run as root group, access host network and host ports, and the kind
of volumes that can be mounted.

* Network policy definition: pods on different namespaces can only access the pods
in the polkadot namespace using the designed ports and protocols.

### Insecure connection with the network cause key leakage

#### Descritpion

If a third party is listening to connections to the remote cluster (both during
creation and during normal operation), the seeds of the keys can be leaked, loosing
control of the associated accounts.

#### Mitigation

* During creation we use an encrypted connection using kubernetes default TLS
settings.

* A SSL certificate is generated for accessing the network through Polkadot UI
using wss.

### kubeconfig leakage

#### Description

After the creation of the cluster, if the kubeconfig file used is lost then a
mallicious actor can gain control over the whole cluster.

#### Mitigation

The kubeconfig information used for creation the cluster is not kept in disk
after creation, it can be retrieved from the cloud provider if needed.

## libp2p

### Node impersonation

#### Description

If the secret node keys used for each node can be obtained from the tool code
then a malicious actor can create nodes that pretend to be other members of the
network.

#### Mitigation

The tool regenerates secret node keys (and associated peer ids) for each
deployment. These are injected securely (with encrypted connection) in the nodes
during creation.
