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
    route:
      group_by: ['alertname']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: default-webhook
      routes:
      {{#if opsgenieEnabled}}
      - receiver: opsgenie
        match:
          severity: critical
        continue: true
      {{/if}}
      - receiver: watcher-webhook
        match:
          app: polkadot-watcher
        continue: true
      - receiver: default-webhook
    receivers:
    - name: default-webhook
      webhook_configs:
      - url:  "http://matrixbot:8080/skill/alertmanager/webhook"
    - name: watcher-webhook
      webhook_configs:
      - url:  "http://watcher-matrixbot:8080/skill/alertmanager/webhook"
    {{#if opsgenieEnabled}}
    - name: opsGenie-receiver
      opsgenie_configs:
      - send_resolved: true
        api_key: {{ opsgenieToken }}
        api_url: {{ opsgenieUrl }}
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
