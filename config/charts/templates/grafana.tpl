env:
  GF_EXPLORE_ENABLED: true
adminPassword: {{ adminPassword }} 
adminUser: {{ adminUser }}
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus-operator-prometheus:9090/
      access: proxy
      isDefault: true
    - name: Loki
      type: loki
      url: http://loki-stack:3100/
      access: proxy
      isDefault: false
      editable: true
dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true
      options:
        path: /var/lib/grafana/dashboards/default
dashboards:
  default:
    polkadot-metrics:
      gnetId: 12410
      revision: 1
      datasource: Prometheus
    kubernetes-pods:
      gnetId: 6336
      revision: 1
      datasource: Prometheus
    node-exporter:
      gnetId: 1860
      revision: 14
      datasource: Prometheus
    kubernetes-pod-overview:
      gnetId: 12842
      revision: 2
      datasource: Prometheus
    kubernetes-app-metrics:
      gnetId: 12841
      revision: 1
      datasource: Prometheus
resources:
  limits:
    cpu: 300m
    memory: 256Mi
  requests:
    cpu: 200m
    memory: 256Mi
persistence:
  enabled: true