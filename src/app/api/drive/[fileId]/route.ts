import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'

export async function GET(
  req: NextRequest,
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

    // Optional resize for lightweight PDFs (?w=600&q=70)
    const widthParam = req.nextUrl.searchParams.get('w')
    const qualityParam = req.nextUrl.searchParams.get('q')
    const width = widthParam ? parseInt(widthParam, 10) : 0

    if (width > 0 && contentType.startsWith('image/')) {
      try {
        const sharp = (await import('sharp')).default
        const quality = qualityParam ? parseInt(qualityParam, 10) : 72
        const resized = await sharp(buffer)
          .resize({ width, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()

        return new NextResponse(new Uint8Array(resized), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, immutable',
          },
        })
      } catch (resizeErr) {
        // If resize fails, fall back to the original buffer below
        console.error('Drive image resize error:', resizeErr)
      }
    }

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
