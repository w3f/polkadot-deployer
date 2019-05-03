[![CircleCI](https://circleci.com/gh/w3f/polkadot-deployer.svg?style=svg)](https://circleci.com/gh/w3f/polkadot-deployer)

# polkadot-deployer

General tool for deploying Polkadot nodes.

## Environment variables

In order to be able to release new versions, these environment variables must be
available:

* `$NPM_TOKEN`

These values are already set on CI, and are available on 1Password, under the
Infrastructure vault, the npm token in an item called `npm token`.
