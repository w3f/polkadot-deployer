additionalPrometheusRules:
- name: heartbeat
  groups:
  - name: heartbeat
    rules:
    - alert: heartbeat
      expr: vector(1)
      labels:
        severity: heartbeat
      annotations:
        message: heartbeat alert. no action required
        summary: heartbeat alert. no action required
        documentation: None
        runbook_url: None
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
  # Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
  rule_files:
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
          alertname: CPUThrottlingHigh
        receiver: opsgenie
        continue: true
      - match:
          alertname: NodeDiskRunningFull
        receiver: opsgenie
        continue: true
      - match:
          alertname: KubePodNotReady
        receiver: opsgenie
        continue: true
      - match:
          alertname: KubePodCrashLooping
        receiver: opsgenie
        continue: true
      - match:
          alertname: KubeMemOvercommit
        receiver: opsgenie
        continue: true
      - match:
          severity: critical
        receiver: opsgenie
        continue: true
      {{/if}}
      - match:
          app: polkadot-watcher
        receiver: watcher
        continue: true
      - receiver: watcher
        match:
          app:
        continue: true
    receivers:
    - name: matrixbot
      webhook_configs:
      - url:  "http://matrixbot:8080/skill/alertmanager/webhook"
    - name: watcher
      webhook_configs:
      - url:  "http://watcher-matrixbot:8080/skill/alertmanager/webhook"
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
