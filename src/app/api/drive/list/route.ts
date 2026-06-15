import { NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'

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

    const imageMap: Record<string, string> = {}
    for (const file of allFiles) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      // Match 13-char alphanumeric code at the start of the filename
      const codeMatch = nameWithoutExt.match(/^([A-Za-z0-9]{13})/)
      if (codeMatch) {
        imageMap[codeMatch[1]] = file.id
      } else {
        imageMap[nameWithoutExt] = file.id
      }
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
