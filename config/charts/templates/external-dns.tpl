rbac:
  create: true

provider: cloudflare

cloudflare:
  apiKey: "{{ cloudflareApiKey }}"
  email: "{{ cloudflareEmail }}"
  proxied: false