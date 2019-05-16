{{/* Generates bootnodes string */}}
{{- define "polkadot-deployer.bootnodes" -}}
/dns4/polkadot-node-0/tcp/30333/p2p/{{ .Values.mainNodeID }}
{{- end }}

{{/* Returns custom-chainspec configmap name */}}
{{- define "polkadot-deployer.custom-chainspec-configmap" -}}
{{ .Chart.Name }}-custom-chainspec
{{- end }}