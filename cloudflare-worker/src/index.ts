/**
 * Cloudflare Worker — Proxy de imagens do Google Drive
 *
 * Autentica no Google com a mesma service account do app (assinatura RS256
 * via Web Crypto), busca o arquivo do Drive e serve com cache eterno.
 * A banda de saída do Cloudflare é gratuita e ilimitada, então isto resolve
 * o estouro de "Fast Origin Transfer" da Vercel.
 *
 * Rota: GET https://<worker>.workers.dev/<fileId>
 */

export interface Env {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string
  GOOGLE_PRIVATE_KEY: string
}

// Cache do access token entre requisições no mesmo isolate
let cachedToken: { token: string; exp: number } | null = null

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
}

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function getAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`

  const keyData = pemToArrayBuffer(env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  )
  const jwt = `${unsigned}.${base64url(sig)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  if (!res.ok) throw new Error('Falha ao obter token: ' + (await res.text()))
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, exp: now + data.expires_in }
  return data.access_token
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(req.url)
    const fileId = url.pathname.replace(/^\/+/, '').split('/')[0]
    if (!fileId) {
      return new Response('Missing file id', { status: 400, headers: corsHeaders() })
    }

    // Cache no edge do Cloudflare (banda gratuita)
    const cache = caches.default
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    const hit = await cache.match(cacheKey)
    if (hit) return hit

    try {
      const token = await getAccessToken(env)
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!driveRes.ok) {
        return new Response('Imagem não encontrada', { status: 404, headers: corsHeaders() })
      }

      const contentType = driveRes.headers.get('content-type') || 'image/jpeg'
      const resp = new Response(driveRes.body, {
        headers: {
          ...corsHeaders(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
      ctx.waitUntil(cache.put(cacheKey, resp.clone()))
      return resp
    } catch (e) {
      return new Response('Erro: ' + (e as Error).message, {
        status: 500,
        headers: corsHeaders(),
      })
    }
  },
}
