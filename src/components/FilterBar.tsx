'use client'
import { useCatalogStore } from '@/store/catalog'

export default function FilterBar() {
  const {
    products, filterNoImage, filterCategory, filterType,
    toggleFilterNoImage, setFilterCategory, setFilterType,
    setSortMode, sortMode, rebuildPages,
  } = useCatalogStore()

  const types = Array.from(new Set(products.map(p => p.type).filter(Boolean))).sort()
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()

  const handleChange = (fn: () => void) => { fn(); rebuildPages() }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros</h3>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Type dropdown */}
        {types.length > 0 && (
          <select
            value={filterType}
            onChange={e => handleChange(() => setFilterType(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#312783]"
          >
            <option value="">Todos os Tipos</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {/* Category dropdown */}
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={e => handleChange(() => setFilterCategory(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#312783]"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Sort mode */}
        <select
          value={sortMode}
          onChange={e => handleChange(() => setSortMode(e.target.value as 'auto' | 'manual'))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#312783]"
        >
          <option value="auto">Ordem Automática</option>
          <option value="manual">Ordem Manual</option>
        </select>

        {/* Image filter toggle */}
        <button
          onClick={() => handleChange(toggleFilterNoImage)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterNoImage ? 'bg-[#312783] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {filterNoImage ? '✓ ' : ''}Ocultar sem imagem
        </button>

        {/* Clear filters */}
        {(filterType || filterCategory || filterNoImage) && (
          <button
            onClick={() => {
              setFilterType('')
              setFilterCategory('')
              if (filterNoImage) toggleFilterNoImage()
              rebuildPages()
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      <div className="text-xs text-gray-400">
        {products.filter(p => !p.hidden).length} produtos visíveis ·{' '}
        {products.filter(p => p.hasImage).length} com imagem ·{' '}
        {products.filter(p => !p.hasImage).length} sem imagem
      </div>
    </div>
  )
}
