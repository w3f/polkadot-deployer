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
      receiver: default
      routes:
      {{#if opsgenieEnabled}}
      - receiver: heartbeats
        match:
          severity: heartbeat
        group_wait: 1s
        group_interval: 1m
        repeat_interval: 50s
      - receiver: opsgenie
        match:
          severity: critical
        continue: true
      {{/if}}
      - receiver: default
    receivers:
    - name: default
      webhook_configs:
      - url:  "http://matrixbot:8080/skill/alertmanager/webhook"
    {{#if opsgenieEnabled}}
    - name: heartbeats
      webhook_configs:
      - http_config:
          basic_auth:
            password: {{ env "OPSGENIE_TOKEN" | default "opsgenie_token" }}
        url: https://api.eu.opsgenie.com/v2/heartbeats/{{ deploymentName }}/ping
    - name: opsgenie
      opsgenie_configs:
      - api_url: {{ env "OPSGENIE_API_URL" | default "https://api.eu.opsgenie.com" }}
        api_key: {{ env "OPSGENIE_TOKEN" | default "opsgenie_token" }}
        message: New Alert in {{ deploymentName }}
        source: {{ deploymentName }}
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

additionalPrometheusRulesMap:
  rule-name:
    groups:
    - name: alertmanager.rules
      rules:
      - alert: heartbeat
      expr: vector(1)
      labels:
        severity: heartbeat
        origin: {{ deploymentName }}
      annotations:
        message: Test alert. no action required
        summary: Test alert. no action required
        documentation: None
        runbook_url: "https://github.com/w3f/infrastructure/wiki/heartbeat-lost"      
