FROM parity/polkadot:v0.4.4 AS polkadot


FROM ubuntu:18.04

RUN apt update && \
  apt install --no-install-recommends -y \
  jq \
  libssl1.0.0 \
  libssl-dev

WORKDIR /app

COPY --from=polkadot /usr/local/bin/polkadot .

RUN ./polkadot build-spec --chain local > ./custom-chainspec.json && \
  rm ./polkadot

RUN jq '.genesis.runtime.indices.ids = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.balances.balances = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.session.validators = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.session.keys = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.staking.validatorCount = 0' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.staking.invulnerables = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.staking.stakers = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.councilSeats.activeCouncil = []' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json && \
  jq '.genesis.runtime.sudo.key = ""' ./custom-chainspec.json > ./custom-chainspec-new.json && \
  cp ./custom-chainspec-new.json ./custom-chainspec.json
