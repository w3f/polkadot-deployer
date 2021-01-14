nameOverride: "prometheus-operator"
fullnameOverride: "prometheus-operator"

defaultRules:
  create: true
  rules:
    alertmanager: true
    etcd: true
    general: true
    k8s: true
    kubeApiserver: true
    kubeApiserverAvailability: true
    kubeApiserverError: true
    kubeApiserverSlos: true
    kubelet: true
    kubePrometheusGeneral: true
    kubePrometheusNodeAlerting: true
    kubePrometheusNodeRecording: true
    kubernetesAbsent: true
    kubernetesApps: true
    kubernetesResources: false
    kubernetesStorage: true
    kubernetesSystem: true
    kubeScheduler: false
    kubeStateMetrics: true
    network: true
    node: true
    prometheus: true
    prometheusOperator: true
    time: true
kubeControllerManager:
  enabled: false
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
        - prometheus-operator
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
      - match:
          severity: critical
        receiver: opsgenie  
        continue: true 
      {{/if}}
      - match:
          alertname: Watchdog
        receiver: heartbeats
        group_wait: 1s
        group_interval: 1m
        repeat_interval: 50s
      - receiver: default
    receivers:
    - name: default
      webhook_configs:
      - url:  "http://matrixbot:8080/skill/alertmanager/webhook"
    - name: heartbeats
    {{#if opsgenieHeartbeatEnabled}}
      {{#if opsgenieEnabled}}
        webhook_configs:
          - http_config:
              basic_auth:
                password: {{ opsgenieToken }}
            url: https://api.eu.opsgenie.com/v2/heartbeats/{{ deploymentName }}/ping    
      {{/if}}
    {{/if}}
    {{#if opsgenieEnabled}}
    - name: opsgenie
      opsgenie_configs:
      - api_url: {{ opsgenieUrl }}
        api_key: {{ opsgenieToken }}
        message: New Alert in {{ deploymentName }}
        source: {{ deploymentName }} 
    {{/if}}
  alertmanagerSpec:
    resources:
      limits:
        cpu: 400m
        memory: 400Mi
      requests:
        cpu: 300m
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

