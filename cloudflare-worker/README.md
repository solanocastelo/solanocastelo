# Casa Freitas — Drive Image Proxy (Cloudflare Worker)

Serve as imagens do Google Drive com **banda de saída gratuita e ilimitada**,
resolvendo o estouro de "Fast Origin Transfer" da Vercel. Autentica com a
mesma service account do app e cacheia as imagens no edge do Cloudflare.

## Pré-requisitos

- Conta gratuita no Cloudflare (https://dash.cloudflare.com/sign-up)
- Node.js instalado

## Passo a passo

```bash
cd cloudflare-worker
npm install

# 1. Login no Cloudflare (abre o navegador)
npx wrangler login

# 2. Configurar os segredos (mesmos valores do .env.local do app)
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
#   cole o email da service account

npx wrangler secret put GOOGLE_PRIVATE_KEY
#   cole a chave privada COMPLETA, incluindo:
#   -----BEGIN PRIVATE KEY-----
#   ...
#   -----END PRIVATE KEY-----
#   (pode colar com as quebras de linha reais OU com \n — o Worker trata ambos)

# 3. Publicar
npx wrangler deploy
```

Ao final, o Wrangler mostra a URL pública, algo como:

```
https://casafreitas-drive-proxy.SEU-SUBDOMINIO.workers.dev
```

## Conectar ao app Next

No projeto Next (Vercel ou onde estiver hospedado), defina a variável de
ambiente **pública**:

```
NEXT_PUBLIC_IMAGE_BASE=https://casafreitas-drive-proxy.SEU-SUBDOMINIO.workers.dev
```

Pronto. O app passa a carregar todas as imagens pelo Worker (banda grátis),
e os dados das planilhas continuam vindo do app normalmente (tráfego mínimo).

## Como testar

Abra no navegador:

```
https://casafreitas-drive-proxy.SEU-SUBDOMINIO.workers.dev/<ID_DE_UM_ARQUIVO_DO_DRIVE>
```

Deve exibir a imagem. Recargas seguintes vêm do cache do edge (rápidas).
