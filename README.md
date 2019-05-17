[![CircleCI](https://circleci.com/gh/w3f/polkadot-deployer.svg?style=svg)](https://circleci.com/gh/w3f/polkadot-deployer)

# polkadot-deployer

General tool for deploying Polkadot nodes, aiming to make it easy to deploy a
local or remote network of nodes.

It is at a early stage of development, currently only supports local deployments
with a limited number of nodes.

## Requirements

The tool is meant to work on Linux and MacOS machines. In order to be able to
use the tool you will require to have installed recent versions of [node](https://nodejs.org/en/download/)
(developed and tested with `v10.7.0` and `v10.15.1`) and [docker](https://docs.docker.com/install/)
for local deployments (developed and tested with `18.09.5`). Once installed, you should also be able to
[run `docker` as a regular user](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user).
See the [Troubleshooting section](#troubleshooting) in case you have problems running the tool.

## Installation

Open a terminal and run this command:

```
$ npm i -g polkadot-deployer
```
Check that all is correct:
```
$ polkadot-deployer --version
```
You can get an overview of the available actions with:
```
$ polkadot-deployer --help
```
Check the [Troubleshooting section](#troubleshooting) if something goes wrong with the installation.

## Usage

`polkadot-deployer` allows you to create, list, update and delete Polkadot
networks of nodes, which we'll call deployments from now on. All the interaction
with the command line tool is done through the following subcommands:

### `create [options]`

Creates a deployment. It accepts a `--config` option with the path of a json
file containing the definition of the deployment, like this:

```
{
  "name": "testnet1",
  "type": "local",
  "nodes": 4
}
```

You can also omit the `--config` option the tool will launch a wizard utility to
get the deployment details.

Each deployment consists of two components, a cluster and a network.

* The cluster is the common platform on top of which the network runs, and
is currently based on kubernetes v1.13.

* The network is composed of a set of polkadot nodes connected together, each of
them created from this [polkadot Helm chart](https://github.com/w3f/polkadot-chart).
Helm charts are application packages for kubernetes, more about them
[here](https://helm.sh/).

Once the deployment is created, the tool sets up a port forwarding process, so
that one of the network nodes' websockets endpoint is available on your local
host. The location of this port is shown at the end of the `polkadot-deployer
create` call:

```
*********************************************************
 Websockets endpoint available at ws://127.0.0.1:11000
*********************************************************
```
You can use that url to access the network from [PolkadotJS -> Settings](https://polkadot.js.org/apps/#/settings)

![UI Settings](/images/ui-settings.png)

### `list`

Shows details of all the created deployments:

```
┌──────────────┬─────────────────┬──────────────────────┬──────────┬─────────┬────────────────┐
│ Network name │ Deployment type │ WebSockets endpoint  │ Provider │ Workers │ Polkadot nodes │
├──────────────┼─────────────────┼──────────────────────┼──────────┼─────────┼────────────────┤
│ testnet1     │ local           │ ws://127.0.0.1:11000 │ kind     │ 1       │ 4              │
└──────────────┴─────────────────┴──────────────────────┴──────────┴─────────┴────────────────┘
```

### `redeploy [name]`

Recreates a network on an existing cluster. It resets all the Polkadot nodes to
their initial state, without having to creating the cluster again.

You can either pass the name of the deployment to recreate or let the wizard
show a list of existing deployments.

### `destroy [name]`

Destroy a deployment including cluster, network and portforwarding process.

You can either pass the name of the deployment to destroy or let the wizard
show a list of existing deployments.

### `benchmark`

Creates deployments and runs benchmarks on them. These are the type of
benchmarks curretly supported:

* *finality*: measures the mean time to finality on several networks with
different number of validators. It accepts a `--config` option with the path
of a json file containing the definition of the benchmark, like this:

```
{
  "name": "benchmark1",
  "type": "local",
  "benchmark": "finality",
  "startNodes": 2,
  "endNodes": 16,
  "blocks": 10
}
```
With this definition, the test will spin up deployments of 2 nodes through 10,
measuring for each of them the mean time to finality of 10 consecutive blocks.
You can pass also the destination of the results as a path in the `--output`
parameter (`./finality-benchmark.json` by default).

## Troubleshooting

* In some cases the installation process can produce errors from the secp256k1
dependency with messages related to the required python version, like:
  ```
  gyp ERR! configure error
  gyp ERR! stack Error: Python executable "/usr/local/opt/python/libexec/bin/python" is v3.7.3, which is not supported by gyp.
  ```
  To solve this problem you can either define some alias from the command line
  before installing:
  ```
  alias python=python2
  alias pip=pip2
  ```
  or call the install command with an additional option:
  ```
  npm i -g --python=python2.7 polkadot-deployer
  ```
  See [this issue](https://github.com/w3f/polkadot-deployer/issues/2) for details.

* For local deployments, if after issuing a create command you find the deployer
stuck with a message like:

  ```
  wait-on(537) waiting for: http://127.0.0.1:10080/kubernetes-ready
  ```
  
  then it is possible that the cluster is not able to be created using your local
  docker installation. Make sure that:

  - The system has enough free disk space (at least 10Gb).
  
  - There are no leftovers on your docker installation. You can clean up with:
  
    ```
    docker system prune -a --volumes
    ```

In case you are experiencing problems and any of the above solution works for
you don't hesitate to [open an issue](https://github.com/w3f/polkadot-deployer/issues/new).

## CI/CD Workflow

When a PR is proposed to this repo, the `npm test` task is run, this includes
linting and unit tests.

After the PR is merged into master, when a semantic version tag (`vX.Y.Z`) is
pushed the tests are run again and, if all is ok, the package is published to
npm registry
