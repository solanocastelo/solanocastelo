import { NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/google'
import { Product } from '@/types/catalog'
import { formatCurrency } from '@/lib/catalog-logic'

export async function GET() {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:Z',
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ products: [] })
    }

    const headers = rows[0].map((h: string) => h.toString().toLowerCase().trim())

    const col = (names: string[]) => {
      for (const name of names) {
        const idx = headers.findIndex((h: string) => h.includes(name))
        if (idx !== -1) return idx
      }
      return -1
    }

    const codeIdx = col(['código', 'codigo', 'referência', 'referencia', 'ref', 'sku', 'code'])
    const nameIdx = col(['nome', 'descrição', 'descricao', 'produto', 'name'])
    const typeIdx = col(['tipo', 'type', 'grupo', 'group'])
    const categoryIdx = col(['categoria', 'category', 'linha', 'line'])
    const priceIdx = col(['preço', 'preco', 'price', 'valor', 'value'])
    const marginIdx = col(['margem', 'margin', '%'])
    const brandIdx = col(['marca', 'brand', 'fabricante'])

    const products: Product[] = rows
      .slice(1)
      .filter((row: string[]) => row.length > 0 && row[codeIdx])
      .map((row: string[], idx: number) => {
        const code = (row[codeIdx] || '').toString().trim()
        const rawPrice =
          parseFloat(
            (row[priceIdx] || '0')
              .toString()
              .replace(/[^\d,.]/g, '')
              .replace(',', '.')
          ) || 0

        return {
          id: `product-${idx}-${code}`,
          code,
          name: (row[nameIdx] || '').toString().trim(),
          type: (row[typeIdx] || '').toString().trim(),
          category: (row[categoryIdx] || '').toString().trim(),
          price: rawPrice,
          priceFormatted: formatCurrency(rawPrice),
          margin:
            marginIdx >= 0
              ? parseFloat((row[marginIdx] || '0').toString()) || undefined
              : undefined,
          brand:
            brandIdx >= 0
              ? (row[brandIdx] || '').toString().trim() || undefined
              : undefined,
          hasImage: false,
          hidden: false,
        }
      })
      .filter((p: Product) => p.code.length > 0)

    return NextResponse.json({ products, totalRows: rows.length - 1 })
  } catch (error) {
    console.error('Sheets API error:', error)
    return NextResponse.json(
      { error: 'Falha ao ler a folha de cálculo. Verifica as credenciais no .env.local.' },
      { status: 500 }
    )
  }
}
