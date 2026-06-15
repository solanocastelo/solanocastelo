export interface Product {
  id: string
  code: string
  name: string
  type: string
  category: string
  price: number
  priceFormatted: string
  margin?: number
  brand?: string
  hasImage: boolean
  imageFileId?: string
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
  sortMode: 'auto' | 'manual'
}
