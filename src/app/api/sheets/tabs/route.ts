import { NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/google'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lista os nomes das abas (sheets) da planilha
export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Variável GOOGLE_SHEETS_ID em falta nas configurações do servidor.' },
        { status: 500 }
      )
    }
    const sheets = await getSheetsClient()
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties(title,index,hidden)',
    })
    const tabs = (meta.data.sheets || [])
      .map(s => s.properties)
      .filter(p => p && !p.hidden)
      .sort((a, b) => (a!.index ?? 0) - (b!.index ?? 0))
      .map(p => p!.title as string)
      .filter(Boolean)

    return NextResponse.json({ tabs })
  } catch (error) {
    console.error('Sheets tabs error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Falha ao listar as abas da planilha. (${detail})` },
      { status: 500 }
    )
  }
}
