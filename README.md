[![CircleCI](https://circleci.com/gh/w3f/polkadot-deployer.svg?style=svg)](https://circleci.com/gh/w3f/polkadot-deployer)

# polkadot-deployer

polkadot-deployer is a general tool for deploying Polkadot nodes, aiming to make it easy to deploy a network of nodes. To learn more about Polkadot explore [the wiki](https://wiki.polkadot.network)
or [join the conversation at Riot](https://riot.im/app/#/room/#polkadot-watercooler:matrix.org).

polkadot-deployer allows you to create local or remote cloud deployments of polkadot. Currently it supports local deployments using Kind and remote deployments using Google Cloud Platform, Amazon's AWS, Microsoft's Azure and Digital Ocean for the infrastructure deployment and Cloudflare for the DNS settings that make your network accessible through websockets RPC.

## Requirements

The tool is meant to work on Linux and MacOS machines. In order to be able to use the tool you will require to have installed recent versions of [node](https://nodejs.org/en/download/) (developed and tested with `v10.7.0` and `v10.15.1`) and 
[docker](https://docs.docker.com/install/) for local deployments (developed and tested with `18.09.5`). Once installed, you should also be able to 
[run docker as a regular user](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user). See the [Troubleshooting section](#troubleshooting) in case you have problems running the tool.

## Installation
In order to deploy a number of polkadot nodes locally. There are two methods to successfully install polkadot validator.
* Install polkadot deployer using yarn packet manager by issuing the following command:
    ```yarn add -g polkadot-deployer```
* Download the latest polkadot deployer from git issuing the following command and change directory to polkadot-deployer:  
	```git clone git@github.com:w3f/polkadot-deployer.git``` and run ```yarn install``` to install all requirements.

## Local deployments
After you have succesfully installed polkadot validator using either method, you may follow the next steps to guide you through the proccess of deployng polkadot validator locally on your hardware. This can be done either using the interactive menu or by using a config file.
* In order to create a validator through the interactive menu issue the following command:  
	```node . create --verbose```  
* In order to deploy polkadot using the preset configuration file: `config/create.local.sample.json` issue the following command:  
	```node . create --config config/create.local.sample.json --verbose```  

The process will start creating an instance of polkadot inside a your local kubernetes cluster that will be created as part of the procedure using [kubernetes-sigs/kind](https://github.com/kubernetes-sigs/kind). The entire procedure will take some time, so it might be a good idea to get some coffee at this point.
Once the procces is done you can also view all your local deployments using the command: ```node . list```

At this point you can attach to the local polkadot web socket by visiting the websockets endpoint available at ws://127.0.0.1:11000 Furthermore you at this point you will be presented with the raw seeds for the created accounts, including the nodeKey, peerId, stash address and seed etc.
Once you are done with your local deployment of polkadot, you can delete your deployment using the destroy [name] command: ```node . destroy testnet5```
More information on the polkadot-deployer usage commands can be found in the [usage](#usage) section.


Check the [Troubleshooting section](#troubleshooting) if something goes wrong with the installation.

## Remote deployments

To perform a remote deployment of polkadot to a public cloud provider we will follow the same general path. The process differs with each public infrastructure provider. Currently we support GCP, AWS, Azure and Digital Ocean. To successfuly deploy polkadot these infastructure providers you will first need to setup a cloudflare account and a GCP account. Cloudflare is used to provide a domain name for your deployment and the GCP for maintaining the state of your deployment. Then you will need to provide the spesific attrubutes required for your deployment in each of the supported providers. The required steps are as follows:

* A Linux machine to run this tool (macOS may fail, see the [Troubleshooting section](#troubleshooting) in case you have problems running the tool).

* Cloudflare credentials as two environment variables `CLOUDFLARE_EMAIL` and `CLOUDFLARE_API_KEY` (see [here](https://api.cloudflare.com/#getting-started))
for details about the API key, the email hould be the one used for registration. Also, your domain name registra should be Cloudflare since this tool relies on Cloudflare for generating SSL certification).

* GCP service account and credentials in the form of the environment variable
`GOOGLE_APPLICATION_CREDENTIALS` with the path of the json credentials file for your service account (see [here](https://cloud.google.com/iam/docs/service-accounts)).
The GCP configuration is required for use by the process to keep the built state. 

* A project on GCP.

* Keep the projectID and domain handly as your will need to edit the config files so that they contain this information.

* Configure specific requirements that depend on your infrastructure provider. More details on this subject are described on the following section for each of the specific providers.

* Read through the [usage](#troubleshooting) section.


---
**NOTE**

Running the following configurations will cause charges by the providers. You should run the corresponding destroy command as soon as you are finished with your testing to avoid unwanted expenses.

---

The required steps to successfully deploy polkadot validator are as follows:


Download the latest polkadot deployer from git issuing the following command:  
```git clone git@github.com:w3f/polkadot-deployer.git``` and run ```npm install``` to install all requirements.


<details><summary>GCP</summary>

To make a deployment on GCP you are required to have the aforementioned GCP service account and project properly configured and meet the following requirements:

* Make sure the service account has sufficient privileges for GKE.

* Enough quota on GCP to create the required resources (terraform will show the exact errors if this condition is not met).

* Kubernetes Engine API and billing enabled for your project (see [here](https://cloud.google.com/kubernetes-engine/docs/quickstart)).

In order to deploy polkadot on GCP you need to edit the preset configuration file: ```config/create.remote.sample-GCP.json``` so that it contains your projectID and domain. Then you can issue the following command:  

 ```node . create --config config/create.remote.sample-GCP.json --verbose```  
	
The process will start creating an instance of polkadot on GCP.
By default a new cluster will be created with the name polkadot-deployer at your default location with 2 `n1-standard-2` nodes under the specified project ID. 

If you wish to delete your remote deployment of polkadot, you can use the destroy [name] command:  

 ```node . destroy gcp-testnet```

</details>

<details><summary>AWS</summary>

To make a deployment on AWS you're required to configure your AWS credentials. It's recommended to do so using the corresponding `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_DEFAULT_REGION` environment variables. You can set the required values for these variables following the provided [documentation](https://docs.aws.amazon.com/amazonswf/latest/awsrbflowguide/set-up-creds.html).

In order to deploy polkadot on GCP you need to edit the preset configuration file: ```config/create.remote.sample-AWS.json``` so that it contains your projectID and domain. Then you can issue the following command: 
 
 ```node . create --config config/create.remote.sample-AWS.json --verbose``` 
 
The process will start creating an instance of polkadot on AWS. The process with create a 2 node cluster using `m4.large` machines. An IAM role and a VPC will be created that will contain the Amazon EKS for the deployment along with the required security groups and ingress rules. You may review the entire process [here](https://github.com/w3f/polkadot-deployer/tree/master/terraform/aws).

If you wish to delete your remote deployment of polkadot, you can use the destroy [name] command:  

 ```node . destroy aws-testnet```  

</details>

<details><summary>Azure</summary>

To deploy polkadot on Azure you're required to set  `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_SUBSCRIPTION_ID`, `ARM_TENANT_ID`, `TF_VAR_client_id` and `TF_VAR_client_secret` environmental variables. You can find your's by following the [documentation](https://docs.microsoft.com/en-us/azure/terraform/terraform-create-k8s-cluster-with-tf-and-aks). 

In order to deploy polkadot on GCP you need to edit the preset configuration file: ```config/create.remote.sample-AZURE.json``` so that it contains your projectID and domain. Then you can issue the following command:  

 ```node . create --config config/create.remote.sample-AZURE.json --verbose```  

The process will start creating an instance of polkadot on Azure, deployed as a 2 ```Standard_D2s_v3```  node kubernetes cluster on your default location connected through a virtual network. Furthermore the required security groups and inbound rules will be applied to your deployment. You may review the entire process [here](https://github.com/w3f/polkadot-deployer/tree/master/terraform/azure). 

If you wish to delete your remote deployment of polkadot, you can use the destroy [name] command:  

 ```node . destroy azure-testnet```  

</details>

<details><summary>Digital Ocean</summary>

To make a deployment on Digital Ocean you're required to configure your Digital Ocean's credentials. You can do this by setting the `DIGITALOCEAN_ACCESS_TOKEN` environment variable. You can get your access token by following the [documentation](https://www.digitalocean.com/docs/api/create-personal-access-token/).

In order to deploy polkadot on GCP you need to edit the preset configuration file: ```config/create.remote.sample-DO.json``` so that it contains your projectID and domain. Then you can issue the following command: 

 ```node . create --config config/create.remote.sample-DO.json --verbose```  

The process will start creating an instance of polkadot on Digital Ocean, using a 2 node kubernetes cluster of `s-4vcpu-8gb` machines. You may review the entire process [here](https://github.com/w3f/polkadot-deployer/tree/master/terraform/do).

If you wish to delete your remote deployment of polkadot, you can use the destroy [name] command:  

 ```node . destroy do-testnet```

</details>

### Multi provider deployment
You may also wish to run a multi AZ multi-provider deployment. In order to do so, you can create a configuration file based on your requirements and create your deployment from there. Keep in mind that you can use any combination of these providers as you see fit. The configuration file: create.remote.sample.json exists only for the purpose of the tutorial and as an example of what you can do. In order to deploy polkadot on GCP you need to edit the preset configuration file: ```config/create.remote.sample.json``` so that it contains your projectID and domain. Then you can issue the following command: 

```node . create --config config/create.remote.sample.json --verbose```  

The process will start creating an instance of polkadot on AWS, AZURE and GCP.

If you wish to delete your remote deployment of polkadot, you can use the destroy [name] command: 
 
 ```node . destroy testnet9```

More information on the polkadot-deployer usage commands can be found in the [usage](#usage) section.



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
  "nodes": 1,
  "remote": {
    "monitoring": true,
    "clusters": [
      {
        "location": "europe-west1-b",
        "projectID": "polkadot-benchmarks",
        "domain": "foo.bar"
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
