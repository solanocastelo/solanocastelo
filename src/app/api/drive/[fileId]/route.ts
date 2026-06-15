import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'

export async function GET(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const drive = await getDriveClient()

    const response = await drive.files.get(
      { fileId: params.fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )

    const buffer = Buffer.from(response.data as ArrayBuffer)
    const contentType =
      (response.headers['content-type'] as string) || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (error) {
    console.error('Drive proxy error:', error)
    return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 })
  }
}
