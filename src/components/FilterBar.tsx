'use client'
import { useCatalogStore } from '@/store/catalog'

export default function FilterBar() {
  const {
    products,
    filterNoImage,
    filterCategory,
    sortMode,
    toggleFilterNoImage,
    setFilterCategory,
    setSortMode,
    rebuildPages,
  } = useCatalogStore()

  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ).sort()

  const Badge = ({
    active,
    onClick,
    children,
  }: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-[#1B3A5C] text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Filtros Rápidos
      </h3>

      <div className="flex flex-wrap gap-2">
        <Badge
          active={filterNoImage}
          onClick={() => {
            toggleFilterNoImage()
            rebuildPages()
          }}
        >
          {filterNoImage ? '✓ ' : ''}Ocultar sem imagem
        </Badge>
        <Badge
          active={sortMode === 'auto'}
          onClick={() => {
            setSortMode('auto')
            rebuildPages()
          }}
        >
          Ordem automática
        </Badge>
        <Badge active={sortMode === 'manual'} onClick={() => setSortMode('manual')}>
          Ordem manual
        </Badge>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            active={filterCategory === ''}
            onClick={() => {
              setFilterCategory('')
              rebuildPages()
            }}
          >
            Todas as categorias
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              active={filterCategory === cat}
              onClick={() => {
                setFilterCategory(cat)
                rebuildPages()
              }}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400">
        {products.filter(p => !p.hidden).length} produtos visíveis ·{' '}
        {products.filter(p => p.hasImage).length} com imagem ·{' '}
        {products.filter(p => !p.hasImage).length} sem imagem
      </div>
    </div>
  )
}
