#!/bin/bash

basedir="$(dirname $0)"

(
    cd $basedir/..
    npx polkadot-deployer destroy -d '.' -c config.json "$@"
)
