#!/bin/bash

basedir="$(dirname $0)"

(
    cd $basedir/..
    npm i
    npx polkadot-deployer create --update -d '.' -c config.json "$@"
)
