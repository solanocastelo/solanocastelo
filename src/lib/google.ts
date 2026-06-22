import { google } from 'googleapis'

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
]

export function getGoogleAuth() {
  // Normaliza a chave privada vinda de variável de ambiente:
  // - remove aspas que às vezes são coladas junto (Netlify/Vercel)
  // - converte \n literais em quebras de linha reais
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
  return new google.auth.JWT({
    email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim(),
    key: privateKey,
    scopes: SCOPES,
  })
}

export async function getSheetsClient() {
  const auth = getGoogleAuth()
  return google.sheets({ version: 'v4', auth })
}

export async function getDriveClient() {
  const auth = getGoogleAuth()
  return google.drive({ version: 'v3', auth })
}
