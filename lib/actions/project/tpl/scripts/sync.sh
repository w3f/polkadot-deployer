#!/bin/bash

basedir="$(dirname $0)"

(
    cd $basedir/..
    npx polkadot-deployer create --update -d '.' -c config.json
)
