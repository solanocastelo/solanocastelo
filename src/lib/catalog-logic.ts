import { Product, CatalogPage } from '@/types/catalog'

const FAMILY_RULES: { keywords: string[]; family: string }[] = [
  { keywords: ['veludo', 'velvet'], family: 'Linha Veludo Premium' },
  { keywords: ['natal', 'natalino', 'natalina'], family: 'Coleção Natal' },
  { keywords: ['kit', 'conjunto'], family: 'Kits' },
  { keywords: ['bola', 'bolas'], family: 'Bolas Decorativas' },
  { keywords: ['led', 'luminoso', 'luminária'], family: 'Iluminação' },
  { keywords: ['guirlanda', 'grinalda'], family: 'Guirlandas' },
  { keywords: ['enfeite', 'enfeites'], family: 'Enfeites Gerais' },
]

export function detectFamily(product: Product): string {
  const nameLower = product.name.toLowerCase()
  for (const rule of FAMILY_RULES) {
    if (rule.keywords.some(kw => nameLower.includes(kw))) {
      return rule.family
    }
  }
  return product.type || 'Outros'
}

export function autoSortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // 1. Tipo/Grupo da planilha
    const typeCompare = (a.type || '').localeCompare(b.type || '', 'pt-BR')
    if (typeCompare !== 0) return typeCompare
    // 2. Família detectada por palavras-chave
    const familyCompare = detectFamily(a).localeCompare(detectFamily(b), 'pt-BR')
    if (familyCompare !== 0) return familyCompare
    // 3. Preço crescente (do mais barato ao mais caro)
    if (a.price !== b.price) return a.price - b.price
    // 4. Nome alfabético como desempate
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}

export function buildPages(products: Product[]): CatalogPage[] {
  const visible = products.filter(p => !p.hidden)
  const pages: CatalogPage[] = []
  for (let i = 0; i < visible.length; i += 4) {
    pages.push({
      id: `page-${Math.floor(i / 4) + 1}`,
      products: visible.slice(i, i + 4),
    })
  }
  return pages
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function suggestFamilyGroups(products: Product[]): Map<string, Product[]> {
  const groups = new Map<string, Product[]>()
  for (const p of products) {
    const family = detectFamily(p)
    if (!groups.has(family)) groups.set(family, [])
    groups.get(family)!.push(p)
  }
  return groups
}
