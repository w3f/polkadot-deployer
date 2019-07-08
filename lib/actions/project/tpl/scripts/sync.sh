#!/bin/bash

basedir="$(dirname ${})"

(
    cd $basedir;
    npx polkadot-deployer create --update -d ./polkadot-deployer/ -c config.json
)
