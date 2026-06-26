import { Product, CatalogPage } from '@/types/catalog'

// Dicionário de termos do segmento: normaliza abreviações e grafias comuns
const TYPE_ALIASES: Record<string, string> = {
  'arvore': 'Árvore de Natal',
  'arvores': 'Árvore de Natal',
  'arvore natal': 'Árvore de Natal',
  'arvore de natal': 'Árvore de Natal',
  'arv natal': 'Árvore de Natal',
  'bola': 'Bolas Decorativas',
  'bolas': 'Bolas Decorativas',
  'bola natal': 'Bolas Decorativas',
  'bolas natal': 'Bolas Decorativas',
  'jogo bola': 'Jogo de Bolas',
  'jogo de bola': 'Jogo de Bolas',
  'jogo bolas': 'Jogo de Bolas',
  'jogo de bolas': 'Jogo de Bolas',
  'kit': 'Kits',
  'kits': 'Kits',
  'conjunto': 'Conjuntos',
  'led': 'Iluminação LED',
  'iluminacao': 'Iluminação LED',
  'iluminação': 'Iluminação LED',
  'luminoso': 'Iluminação LED',
  'luminaria': 'Luminária',
  'luminária': 'Luminária',
  'guirlanda': 'Guirlandas',
  'guirlandas': 'Guirlandas',
  'grinalda': 'Guirlandas',
  'enfeite': 'Enfeites',
  'enfeites': 'Enfeites',
  'decorativo': 'Decorativos',
  'decorativos': 'Decorativos',
  'decoracao': 'Decoração',
  'decoração': 'Decoração',
  'veludo': 'Linha Veludo',
  'velvet': 'Linha Veludo',
  'estrela': 'Estrelas',
  'estrelas': 'Estrelas',
  'sino': 'Sinos',
  'sinos': 'Sinos',
  'papai noel': 'Papai Noel',
  'pai natal': 'Papai Noel',
  'boneco neve': 'Boneco de Neve',
  'boneco de neve': 'Boneco de Neve',
  'rena': 'Renas',
  'renas': 'Renas',
  'presepio': 'Presépio',
  'presépio': 'Presépio',
  'natal': 'Natal',
  'natalino': 'Natal',
  'natalina': 'Natal',
  'outros': 'Outros',
  'other': 'Outros',
  'geral': 'Geral',
}

// Transforma qualquer valor de tipo/grupo da planilha num label legível
export function formatType(raw: string | undefined | null): string {
  if (!raw) return 'Outros'
  // normaliza: lowercase, remove underscores/hifens extras, trim
  const normalized = raw
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // lookup no dicionário
  if (TYPE_ALIASES[normalized]) return TYPE_ALIASES[normalized]
  // tenta match parcial (ex: "arvore natal 210cm" → "Árvore de Natal")
  for (const [key, label] of Object.entries(TYPE_ALIASES)) {
    if (normalized.startsWith(key) || normalized.includes(key)) return label
  }
  // fallback: Title Case com acentuação preservada
  return normalized.replace(/\b\w/g, c => c.toLocaleUpperCase('pt-BR'))
}

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
