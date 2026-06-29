import { NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Extrai o código de 13 caracteres do nome do ficheiro.
// Funciona mesmo que o nome tenha caracteres extra, prefixos ou separadores:
//   "008180A000217.jpg"            → "008180A000217"
//   "008180A000217_foto1.png"      → "008180A000217"
//   "008180A000217-2.webp"         → "008180A000217"
//   "IMG_008180A000217 (1).jpeg"   → "008180A000217"
//   "008180A000217 frente.jpg"     → "008180A000217"
function extractCode(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  // Procura o primeiro bloco com pelo menos 13 caracteres alfanuméricos
  // consecutivos e usa os primeiros 13 como chave.
  const block = nameWithoutExt.match(/[A-Za-z0-9]{13,}/)
  if (block) return block[0].slice(0, 13)
  // Sem bloco de 13: tenta os primeiros 13 alfanuméricos do nome inteiro
  const alnum = nameWithoutExt.replace(/[^A-Za-z0-9]/g, '')
  if (alnum.length >= 13) return alnum.slice(0, 13)
  // Fallback: nome limpo (mantém comportamento anterior para nomes curtos)
  return nameWithoutExt.trim()
}

export async function GET() {
  try {
    const drive = await getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    let allFiles: { id: string; name: string }[] = []
    let pageToken: string | undefined

    do {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'nextPageToken, files(id, name)',
        pageSize: 1000,
        pageToken,
      })

      const files = response.data.files || []
      allFiles = allFiles.concat(
        files.map((f: { id?: string | null; name?: string | null }) => ({
          id: f.id!,
          name: f.name!,
        }))
      )
      pageToken = response.data.nextPageToken || undefined
    } while (pageToken)

    const imageMap: Record<string, string[]> = {}
    for (const file of allFiles) {
      const key = extractCode(file.name)
      if (!imageMap[key]) imageMap[key] = []
      imageMap[key].push(file.id)
    }

    return NextResponse.json({ imageMap, total: allFiles.length })
  } catch (error) {
    console.error('Drive list error:', error)
    return NextResponse.json(
      { error: 'Falha ao listar imagens do Google Drive.' },
      { status: 500 }
    )
  }
}
