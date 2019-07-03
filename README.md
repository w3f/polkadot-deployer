[![CircleCI](https://circleci.com/gh/w3f/polkadot-deployer.svg?style=svg)](https://circleci.com/gh/w3f/polkadot-deployer)

# polkadot-deployer

General tool for deploying Polkadot nodes, aiming to make it easy to deploy a
local or remote network of nodes. To learn more about Polkadot explore [the wiki](https://wiki.polkadot.network)
or [join the conversation at Riot](https://riot.im/app/#/room/#polkadot-watercooler:matrix.org).

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

## Remote deployments

polkadot-deployer allows you to create remote cloud deployments, currently it
supports Google Cloud Platform for the infrastructure and Cloudflare for the
DNS settings that make your network accessible through websockets RPC.

In order to be able to deploy remotely you will need:

* A project on GCP.

* You need to run this tool on Linux machine. (macOS may fail.)

* GCP service account and credentials in the form of the environment variable
`GOOGLE_APPLICATION_CREDENTIALS` with the path of the json credentials file for
your service account (see [here](https://cloud.google.com/iam/docs/service-accounts) for details and make sure the service account has sufficient privileges for GKE).

* Cloudflare credentials as two environment variables `CLOUDFLARE_EMAIL` and
`CLOUDFLARE_API_KEY` (see [here](https://api.cloudflare.com/#getting-started)
for details about the API key, the email hould be the one used for registration. Also, your domain name registra should be Cloudflare since this tool relies on Cloudflare for generating SSL certification).

* Enough quota on GCP to create the required resources (terraform will show the
exact errors if this condition is not met).

* Kubernetes Engine API and billing enabled for your project, see [here](https://cloud.google.com/kubernetes-engine/docs/quickstart).

## Usage

`polkadot-deployer` allows you to create, list, update and delete Polkadot
networks of nodes, which we'll call deployments from now on. All the interaction
with the command line tool is done through the following subcommands:

### `create [options]`

Creates a deployment. It accepts a `--config` option with the path of a json
file containing the definition of the deployment, like this for local deployments:

```
{
  "name": "testnet1",
  "type": "local",
  "nodes": 4
}
```
or this for remote deployments:
```
{
  "name": "testnet6",
  "type": "gcp",
  "nodes": 45,
  "remote": {
    "monitoring": true,
    "clusters": [
      {
        "location": "europe-west1-b",
        "projectID": "polkadot-benchmarks",
        "domain": "w3f.tech"
      }
    ]
  }
}
```

These are the fields you can use:

* `name`: unique string to distinguish your deployment in subsequent commands.

* `type`: either local or remote, `local` or `gcp` allowed.

* `nodes`: number of validators of the network, an integer between 2 and 20.

* `remote.monitoring`: enable monitoring stack, see the [Monitoring section](#monitoring)

* `remote.clusters[i].location`: region or zone to use for the deployment.

* `remote.clusters[i].projectID`: id of the GCP project.

* `remote.clusters[i].domain`: under which domain the tool will create the websockets endpoint.

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
    "name": "bm1",
    "type": "local",
    "benchmark": "finality",
    "startNodes": 2,
    "endNodes": 10,
    "blocks": {
      "offset": 10,
      "measure": 10
    },
    "reuseCluster": true
  }
  ```

  With this definition, the test will spin up deployments of 2 nodes through 10,
  measuring for each of them the mean time to finality of 10 consecutive blocks.
  These are the fields specific to this benchmark that you can use:

  * `benchmark`: which tests to run, currently only `finality` implemented.

  * `startNodes`: how many validators will be used in the first run.

  * `endNodes`: how many validators will be used in the last run, the process will
  increment the number of nodes in 1 on each run.

  * `blocks.offset`: number of blocks to wait before starting to the measurements.

  * `blocks.measure`: number of blocks on which the metrics will be recorded.

  * `reuseCluster`: if true the cluster will be cleaned but not deleted after the
  benchmark is finished and can be used in subsequent runs, this can speed up the
  execution.

  You can pass also the destination directory of the result files in the `--output`
  parameter (current directory by default).

  After the benchmarks are done the results are written to a json file, which
  includes all the metrics and the details of the execution, and to a file compatible
  with gnuplot, that can generate a png file with a plot of the results:

  ```
  $ polkadot-deployer benchmark -c ./config/benchmark.finality.sample.json
  Initializing nodes...
  Done
  Waiting for nodes ready...
  Done
  ***************************************
   Starting benchmarks with 2 nodes
  ***************************************
  New produced block: 1, timestamp: 1558369995883
  Last finalized block: 1, finalized at: 1558370001258

  ...

  ***************************************
   Finished benchmarks with 6 nodes
  ***************************************
  Done
  Results writen to ./polkadot-deployer.benchmark.finality.20190520-063948.json
  gnuplot writen to ./polkadot-deployer.benchmark.finality.20190520-063948.gnuplot

  $ gnuplot /polkadot-deployer.benchmark.finality.20190520-063948.gnuplot
  ```
  The previous gnuplot command will generate a `benchmark.png` file with the
  benchmark plot on the current directory.

## Monitoring

You can enable monitoring for remote deployments, by setting `remote.monitoring`
to true in the configuration. When enabled, polkadot-deployer will install
a generic monitoring stack composed of prometheus, alertmanager, grafana and loki,
and a more polkadot-specific set of tools around [substrate-telemetry](https://github.com/paritytech/substrate-telemetry).

There will be a grafana instance deployed per cluster, and they will be accessible
at `https://grafana.<deployment_name>-<n>.<domain>`, being `n` the order of the
cluster in the config starting with 0, and can be accessed with username `admin`
and password controlled by the envirnment variable `GRAFANA_PASSWORD` (`grafanapassword`
if not set).

All the nodes in the deployment will be sending operational data to a substrate-telemetry
backend deployed on the first cluster (according to the config definition order).
Connected to that backend is also a frontend accessible at `https://telemetry.<deployment_name>-0.<domain>`.

A prometheus exporter is also deployed as part of the substrate-telemetry pod,
there is a grafana dashboard called `Polkadot Metrics` showing information from
the exposed metrics.

## Troubleshooting

Below are some common problems found by users. If you have an issue and this
suggestions don't help don't hesitate to [open an issue](https://github.com/w3f/polkadot-deployer/issues/new).
You can get more information about what is the actual adding the `--verbose`
option to any polkadot-deployer command.

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
