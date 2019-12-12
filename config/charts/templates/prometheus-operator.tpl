defaultRules:
  create: false
kubeDns:
  enabled: false
coreDns:
  enabled: false
kubeApiServer:
  enabled: false
grafana:
  enabled: false
nodeExporter:
  enabled: false
prometheus:
  prometheusSpec:
    ruleSelector:
      matchExpressions:
      - key: app
        operator: In
        values:
        - polkadot
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 700m
        memory: 3Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 20Gi

alertmanager:
  config:
    global:
      resolve_timeout: 5m
      {{#if opsgenieEnabled}}
      opsgenie_api_url: https://api.eu.opsgenie.com/
      opsgenie_api_key: {{ opsgenieToken }}
      {{/if}}
    route:
      group_by: ['alertname', 'priority']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 3h
      receiver: matrixbot
      routes:
      {{#if opsgenieEnabled}}
      - match:
          severity: critical
        receiver: opsgenie
        continue: true
      {{/if}}
    receivers:
    - name: matrixbot
      webhook_configs:
      - url:  "http://matrixbot:8080/skill/alertmanager/webhook"
    {{#if opsgenieEnabled}}
    - name: opsgenie
      opsgenie_configs:
      - api_key:
    {{/if}}
  alertmanagerSpec:
    resources:
      limits:
        cpu: 10m
        memory: 400Mi
      requests:
        cpu: 10m
        memory: 400Mi
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
prometheusOperator:
  resources:
    limits:
      cpu: 200m
      memory: 200Mi
    requests:
      cpu: 100m
      memory: 100Mi
kubeStateMetrics:
  resources:
    limits:
      cpu: 10m
      memory: 16Mi
    requests:
      cpu: 10m
      memory: 16Mi
