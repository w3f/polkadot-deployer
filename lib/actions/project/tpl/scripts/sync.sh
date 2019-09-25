#!/bin/bash

basedir="$(dirname $0)"

(
    source "${POLKADOT_NODE_ENV_VARS}"
    cd $basedir/..
    yarn
    npx polkadot-deployer create --update -d '.' -c config.json "$@"
)
