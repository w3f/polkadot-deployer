FROM parity/polkadot:v0.4.4 AS polkadot


FROM ubuntu:18.04

RUN apt update && \
  apt install --no-install-recommends -y \
  jq \
  libssl1.0.0 \
  libssl-dev

WORKDIR /app

COPY --from=polkadot /usr/local/bin/polkadot .

RUN ./polkadot build-spec --chain local > ./base-chainspec.json && \
  rm ./polkadot

RUN jq '.genesis.runtime.indices.ids = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.balances.balances = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.session.validators = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.session.keys = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.staking.validatorCount = 0' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.staking.invulnerables = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.staking.stakers = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.councilSeats.activeCouncil = []' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json && \
  jq '.genesis.runtime.sudo.key = ""' ./base-chainspec.json > ./base-chainspec-new.json && \
  cp ./base-chainspec-new.json ./base-chainspec.json
