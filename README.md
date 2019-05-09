[![CircleCI](https://circleci.com/gh/w3f/polkadot-deployer.svg?style=svg)](https://circleci.com/gh/w3f/polkadot-deployer)

# polkadot-deployer

General tool for deploying Polkadot nodes, aiming to make it easy to deploy a
local or remote network of nodes.

It is at a early stage of development, currently only supports local deployments
with a limited number of nodes.

## Requirements

The tool is meant to work on Linux and MacOS machines. In order to be able to
use the tool you will require to have installed [node](https://nodejs.org/en/download/)
and [docker](https://docs.docker.com/install/). Once installed, you should also be able to
[run `docker` as a regular user](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user).

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
them created from the Helm chart at [./charts/polkadot](). Helm charts are
application packages for kubernetes, more about them [here](https://helm.sh/).

Once the deployment is created, the tool sets up a port forwarding process, so
that one of the network nodes' websockets endpoint is available on your local
host. The location of this port is shown at the end of the `polkadot-deployer
create` call:

```
*********************************************************
 Websockets endpoint available at ws://127.0.0.1:11000
*********************************************************
```
You can use that url to access the network from https://polkadot.js.org/apps

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

## CI/CD Workflow

When a PR is proposed to this repo, the `npm test` task is run, this includes
linting and unit tests.

After the PR is merged into master, when a semantic version tag (`vX.Y.Z`) is
pushed the tests are run again and, if all is ok, the package is published to
npm registry
