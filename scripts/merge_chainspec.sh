#!/bin/sh

CUSTOM_CHAINSPEC="${1}"
DESTINATION_CHAINSPEC="${2}"

if [ -z "${CUSTOM_CHAINSPEC}" ] || [ -z "${DESTINATION_CHAINSPEC}" ]; then
    echo "Usage: merge_chainspec.sh <custom_chainspec_file> <destination_chainspec_file>"
    exit 1
fi

jq -s '.[0] * .[1]' /app/base_chainspec.json "${CUSTOM_CHAINSPEC}" > /app/tmp.json

/app/polkadot build-spec --chain /app/tmp.json --raw > "${DESTINATION_CHAINSPEC}"
