import { NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/google'
import { Product } from '@/types/catalog'
import { formatCurrency } from '@/lib/catalog-logic'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parsePrice(val: string): number {
  return parseFloat((val || '0').toString().replace(/[^\d,.]/g, '').replace(',', '.')) || 0
}

export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Variável GOOGLE_SHEETS_ID em falta nas configurações do servidor.' },
        { status: 500 }
      )
    }
    const sheets = await getSheetsClient()

    // Aba selecionada via ?tab= — se ausente, usa a primeira aba da planilha
    const tab = new URL(request.url).searchParams.get('tab')?.trim()
    // Escapa aspas simples no nome da aba para o formato de range A1
    const range = tab ? `'${tab.replace(/'/g, "''")}'!A:Z` : 'A:Z'

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ products: [] })
    }

    const headers = rows[0].map((h: string) => h.toString().toLowerCase().trim())

    // Procura primeiro por correspondência exata do cabeçalho, depois parcial
    const col = (names: string[]) => {
      for (const name of names) {
        const exact = headers.findIndex((h: string) => h === name)
        if (exact !== -1) return exact
      }
      for (const name of names) {
        const idx = headers.findIndex((h: string) => h.includes(name))
        if (idx !== -1) return idx
      }
      return -1
    }

    // Mapeamento das colunas do Sheet Casa Freitas:
    // Código | Referência | Produto | Tipo | Caixa Master | Preço Tabela | Preço Atacado
    // Algumas abas usam apenas "C" no cabeçalho do código; se nada casar,
    // assume a coluna A (índice 0) como código.
    let codeIdx        = col(['código', 'codigo', 'c'])
    if (codeIdx === -1) codeIdx = 0
    const refIdx       = col(['referência', 'referencia', 'ref'])
    const nameIdx      = col(['produto', 'nome', 'descrição', 'descricao', 'name'])
    const typeIdx      = col(['tipo', 'type', 'grupo'])
    const categoryIdx  = col(['categoria', 'category', 'linha'])
    const caixaIdx     = col(['caixa master', 'caixa'])
    const priceTabIdx  = col(['preço tabela', 'preco tabela', 'tabela', 'price'])
    const priceAtkIdx  = col(['preço atacado', 'preco atacado', 'atacado'])

    // fallback: se só tiver um campo de preço
    const priceIdx = priceAtkIdx >= 0 ? priceAtkIdx : col(['preço', 'preco', 'valor', 'value'])
    const origIdx  = priceTabIdx >= 0 ? priceTabIdx : -1

    const products: Product[] = rows
      .slice(1)
      .filter((row: string[]) => row.length > 0 && row[codeIdx])
      .map((row: string[], idx: number) => {
        const code        = (row[codeIdx] || '').toString().trim()
        const reference   = refIdx >= 0 ? (row[refIdx] || '').toString().trim() : ''
        const priceAtk    = parsePrice(row[priceIdx])
        const priceTab    = origIdx >= 0 ? parsePrice(row[origIdx]) : priceAtk
        const discount    = priceTab > priceAtk && priceTab > 0
          ? Math.round(((priceTab - priceAtk) / priceTab) * 100)
          : 0

        return {
          id: `product-${idx}-${code}`,
          code,
          reference,
          name: (row[nameIdx] || '').toString().trim(),
          type: (row[typeIdx] || '').toString().trim(),
          category: categoryIdx >= 0 ? (row[categoryIdx] || '').toString().trim() : '',
          caixaMaster: caixaIdx >= 0 ? (row[caixaIdx] || '').toString().trim() : '',
          priceOriginal: priceTab,
          priceOriginalFormatted: formatCurrency(priceTab),
          price: priceAtk,
          priceFormatted: formatCurrency(priceAtk),
          discountPercent: discount,
          hasImage: false,
          hidden: false,
        }
      })
      .filter((p: Product) => p.code.length > 0)

    return NextResponse.json({ products, headers, totalRows: rows.length - 1 })
  } catch (error) {
    console.error('Sheets API error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Falha ao ler a folha de cálculo. Verifica as credenciais. (${detail})` },
      { status: 500 }
    )
  }
}
