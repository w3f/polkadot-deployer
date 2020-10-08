image:
  tag: {{ imageTag }}

exporter:
  config:
    subscribe:
      chains:
      - {{ subscribedChain }}
domain: {{ telemetryDomain }}
