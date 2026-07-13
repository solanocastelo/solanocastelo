export interface Product {
  id: string
  code: string
  reference: string          // Referência curta (ex: BT04307)
  name: string
  type: string
  category: string
  priceOriginal: number      // Preço Tabela (riscado)
  priceOriginalFormatted: string
  price: number              // Preço Atacado (principal)
  priceFormatted: string
  discountPercent: number    // % calculado automaticamente
  caixaMaster: string
  hasImage: boolean
  imageFileId?: string
  imageFileIds?: string[]
  imageUrl?: string
  customImageBase64?: string
  cropData?: CropData
  hidden: boolean
}

export interface CropData {
  x: number
  y: number
  width: number
  height: number
  zoom: number
}

export interface CampaignConfig {
  title: string
  paymentTerms: string
  minimumOrder: string
  validityFrom: string
  validityTo: string
  plaza: string
  commercialEmail: string
  coverImageBase64?: string
  showOriginalPrice: boolean  // exibe "preço de" riscado
  showDiscount: boolean       // exibe selo "% OFF"
}

export interface CatalogPage {
  id: string
  products: Product[]
}

export interface CatalogState {
  products: Product[]
  pages: CatalogPage[]
  campaign: CampaignConfig
  loading: boolean
  error: string | null
  selectedProductId: string | null
  filterNoImage: boolean
  filterCategory: string
  filterType: string
  sortMode: 'auto' | 'manual' | 'original'
}
