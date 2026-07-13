'use client'
import { useState, useEffect } from 'react'
import { useCatalogStore } from '@/store/catalog'
import CampaignForm from '@/components/CampaignForm'
import FilterBar from '@/components/FilterBar'
import LivePreview from '@/components/LivePreview'
import ProductList from '@/components/ProductList'
import CoverUpload from '@/components/CoverUpload'
import ExportButton from '@/components/ExportButton'
import FamilySuggestions from '@/components/FamilySuggestions'
import MissingImages from '@/components/MissingImages'
import TypeLabelsEditor from '@/components/TypeLabelsEditor'
import { Product } from '@/types/catalog'
import { driveImageUrl } from '@/lib/imageUrl'

export default function Home() {
  const { setProducts, setError, error, products, pages } =
    useCatalogStore()
  const [loading, setLoading] = useState<'sheets' | 'drive' | false>(false)

  const loadAll = async () => {
    setLoading('sheets')
    try {
      const [sheetsRes, driveRes] = await Promise.all([
        fetch('/api/sheets', { cache: 'no-store' }),
        fetch('/api/drive/list', { cache: 'no-store' }),
      ])
      const sheetsData = await sheetsRes.json()
      if (sheetsData.error) throw new Error(sheetsData.error)
      const driveData = await driveRes.json()
      const imageMap: Record<string, string[]> = driveData.imageMap || {}
      const enriched: Product[] = (sheetsData.products || []).map((p: Product) => {
        const fileIds = imageMap[p.code] || []
        const fileId = fileIds[0]
        return { ...p, imageFileIds: fileIds, imageFileId: fileId, imageUrl: fileId ? driveImageUrl(fileId) : undefined, hasImage: fileIds.length > 0 }
      })
      setProducts(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadSheets = async () => {
    setLoading('sheets')
    try {
      const res = await fetch('/api/sheets', { cache: 'no-store' })
      const sheetsData = await res.json()
      if (sheetsData.error) throw new Error(sheetsData.error)
      // Preserve existing image data
      const currentProducts = useCatalogStore.getState().products
      const imageByCode: Record<string, Pick<Product, 'imageFileId'|'imageFileIds'|'imageUrl'|'hasImage'|'customImageBase64'|'cropData'>> = {}
      currentProducts.forEach(p => {
        imageByCode[p.code] = { imageFileId: p.imageFileId, imageFileIds: p.imageFileIds, imageUrl: p.imageUrl, hasImage: p.hasImage, customImageBase64: p.customImageBase64, cropData: p.cropData }
      })
      const enriched: Product[] = (sheetsData.products || []).map((p: Product) => ({
        ...p,
        ...(imageByCode[p.code] || { hasImage: false }),
      }))
      setProducts(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadDrive = async () => {
    setLoading('drive')
    try {
      const res = await fetch('/api/drive/list', { cache: 'no-store' })
      const driveData = await res.json()
      const imageMap: Record<string, string[]> = driveData.imageMap || {}
      const currentProducts = useCatalogStore.getState().products
      const enriched: Product[] = currentProducts.map(p => {
        const fileIds = imageMap[p.code] || []
        const fileId = fileIds[0]
        return { ...p, imageFileIds: fileIds, imageFileId: fileId, imageUrl: fileId ? driveImageUrl(fileId) : undefined, hasImage: fileIds.length > 0 }
      })
      setProducts(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar fotos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#312783] text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#C8992A] rounded-xl flex items-center justify-center font-bold text-[#0D1F33] text-lg">
              CF
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Casa Freitas</h1>
              <p className="text-white/50 text-xs mt-0.5">Gerador de Encartes B2B</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {products.length > 0 && (
              <span className="text-white/40 text-xs">
                {products.length} produtos · {pages.length} página(s)
              </span>
            )}
            {products.length === 0 ? (
              <button
                onClick={loadAll}
                disabled={!!loading}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <span className="animate-spin inline-block">⏳</span> : <span>🔄</span>}
                {loading ? 'Carregando...' : 'Carregar do Google'}
              </button>
            ) : (
              <>
                <button onClick={loadSheets} disabled={!!loading} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                  {loading === 'sheets' ? <span className="animate-spin inline-block">⏳</span> : <span>📊</span>}
                  {loading === 'sheets' ? 'Atualizando...' : 'Atualizar Dados'}
                </button>
                <button onClick={loadDrive} disabled={!!loading} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                  {loading === 'drive' ? <span className="animate-spin inline-block">⏳</span> : <span>🖼️</span>}
                  {loading === 'drive' ? 'Atualizando...' : 'Atualizar Fotos'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-3">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => useCatalogStore.getState().setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main 3-column Layout */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-[300px_1fr_280px] gap-6">
        {/* Left Panel — Campaign Config */}
        <aside className="space-y-4">
          <CampaignForm />
          <CoverUpload />
          <ExportButton />
        </aside>

        {/* Center — Preview + Product List */}
        <div className="space-y-4 min-w-0">
          <FilterBar />
          <FamilySuggestions />
          <LivePreview />
          <ProductList />
        </div>

        {/* Right Panel — Stats + Setup Guide */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#312783] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C8992A] inline-block" />
              Resumo
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total de Produtos', value: products.length },
                { label: 'Com Imagem', value: products.filter(p => p.hasImage).length },
                { label: 'Sem Imagem', value: products.filter(p => !p.hasImage).length },
                { label: 'Ocultos', value: products.filter(p => p.hidden).length },
                { label: 'Páginas de Produto', value: pages.length },
                { label: 'Total de Páginas (c/ capa)', value: pages.length > 0 ? pages.length + 1 : 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-[#312783]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <MissingImages />

          <TypeLabelsEditor />

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#312783] text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C8992A] inline-block" />
              Setup Google APIs
            </h3>
            <div className="space-y-2 text-xs text-gray-500">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Acede ao{' '}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#312783] underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Activa <strong>Sheets API</strong> e <strong>Drive API</strong></li>
                <li>Cria uma <strong>Service Account</strong> e descarrega as credenciais JSON</li>
                <li>
                  Partilha o Sheet e a pasta Drive com o email da service account (Leitor)
                </li>
                <li>
                  Copia <code className="bg-gray-100 px-1 rounded">.env.local.example</code> para{' '}
                  <code className="bg-gray-100 px-1 rounded">.env.local</code> e preenche
                </li>
              </ol>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-amber-700 font-medium">IDs já configurados:</p>
                <p className="text-amber-600 mt-1 font-mono break-all">
                  Sheets: 1Ab2IBTmaH...
                </p>
                <p className="text-amber-600 font-mono break-all">
                  Drive: 1wClR0tYmv...
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
