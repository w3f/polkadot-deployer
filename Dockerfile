FROM parity/polkadot:v0.4.4 AS polkadot


FROM ubuntu:18.04

RUN apt update && \
  apt install --no-install-recommends -y \
  jq \
  libssl1.0.0 \
  libssl-dev

WORKDIR /app

COPY --from=polkadot /usr/local/bin/polkadot .

RUN ./polkadot build-spec --chain local > ./base_chainspec.json && \
  rm ./polkadot

COPY scripts/ .
