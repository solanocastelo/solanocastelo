import { create } from 'zustand'
import { CatalogState, CatalogPage, CampaignConfig, Product } from '@/types/catalog'
import { autoSortProducts, buildPages } from '@/lib/catalog-logic'

interface CatalogStore extends CatalogState {
  setProducts: (products: Product[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCampaign: (campaign: Partial<CampaignConfig>) => void
  toggleProductHidden: (id: string) => void
  toggleFilterNoImage: () => void
  setFilterCategory: (cat: string) => void
  setFilterType: (type: string) => void
  setSortMode: (mode: 'auto' | 'manual') => void
  reorderPages: (pages: CatalogPage[]) => void
  moveProduct: (productId: string, targetPageIndex: number, targetPosition: number) => void
  setSelectedProduct: (id: string | null) => void
  updateProductImage: (id: string, base64: string, cropData?: Product['cropData']) => void
  rebuildPages: () => void
}

const defaultCampaign: CampaignConfig = {
  title: 'Encarte Casa Freitas',
  paymentTerms: '60/90/120 dias',
  minimumOrder: 'R$ 5.000,00',
  validityFrom: '',
  validityTo: '',
  plaza: 'Ceará',
  commercialEmail: 'comercial@casafreitas.com.br',
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  products: [],
  pages: [],
  campaign: defaultCampaign,
  loading: false,
  error: null,
  selectedProductId: null,
  filterNoImage: false,
  filterCategory: '',
  filterType: '',
  sortMode: 'auto',

  setProducts: (products) => {
    set({ products })
    get().rebuildPages()
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setCampaign: (campaign) =>
    set(state => ({ campaign: { ...state.campaign, ...campaign } })),

  toggleProductHidden: (id) => {
    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, hidden: !p.hidden } : p
      ),
    }))
    get().rebuildPages()
  },

  toggleFilterNoImage: () =>
    set(state => ({ filterNoImage: !state.filterNoImage })),

  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setFilterType: (type) => set({ filterType: type }),
  setSortMode: (mode) => set({ sortMode: mode }),

  reorderPages: (pages) => set({ pages }),

  moveProduct: (productId, targetPageIndex, targetPosition) => {
    const state = get()
    const allProducts = state.pages.flatMap(p => p.products)
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    const withoutProduct = allProducts.filter(p => p.id !== productId)
    const insertAt = targetPageIndex * 6 + targetPosition
    withoutProduct.splice(insertAt, 0, product)

    set({ pages: buildPages(withoutProduct), sortMode: 'manual' })
  },

  setSelectedProduct: (id) => set({ selectedProductId: id }),

  updateProductImage: (id, base64, cropData) => {
    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, customImageBase64: base64, cropData, hasImage: true } : p
      ),
    }))
    get().rebuildPages()
  },

  rebuildPages: () => {
    const state = get()
    let filtered = state.products.filter(p => {
      if (state.filterNoImage && !p.hasImage) return false
      if (state.filterCategory && p.category !== state.filterCategory) return false
      if (state.filterType && p.type !== state.filterType) return false
      return true
    })
    if (state.sortMode === 'auto') {
      filtered = autoSortProducts(filtered)
    }
    set({ pages: buildPages(filtered) })
  },
}))
