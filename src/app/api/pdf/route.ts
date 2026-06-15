import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { previewHtml, campaign } = body

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 })
    await page.setContent(previewHtml, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    })

    const pdf = await page.pdf({
      width: '1080px',
      height: '1920px',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })

    await browser.close()

    const title = (campaign?.title || 'casa-freitas')
      .replace(/\s+/g, '-')
      .toLowerCase()

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="encarte-${title}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar PDF.' },
      { status: 500 }
    )
  }
}
