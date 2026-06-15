'use client'
import { useMemo, useState } from 'react'
import { useCatalogStore } from '@/store/catalog'
import { suggestFamilyGroups } from '@/lib/catalog-logic'

export default function FamilySuggestions() {
  const { products } = useCatalogStore()
  const [expanded, setExpanded] = useState(false)

  const groups = useMemo(
    () => suggestFamilyGroups(products.filter(p => !p.hidden)),
    [products]
  )
  const families = Array.from(groups.entries()).filter(([, prods]) => prods.length > 1)

  if (families.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span className="text-sm font-semibold text-amber-800">
            {families.length} grupo(s) de família detectado(s)
          </span>
        </div>
        <span className="text-amber-500 text-xs">{expanded ? '▲ fechar' : '▼ ver'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {families.map(([family, prods]) => (
            <div key={family} className="bg-white rounded-lg p-3 border border-amber-100">
              <p className="text-xs font-semibold text-amber-900">{family}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {prods.length} produtos ·{' '}
                {prods
                  .slice(0, 3)
                  .map(p => p.name)
                  .join(', ')}
                {prods.length > 3 ? ` +${prods.length - 3} mais` : ''}
              </p>
            </div>
          ))}
          <p className="text-xs text-amber-600 mt-2">
            Estes grupos são detectados automaticamente. Usa o modo manual para ajustar a
            posição e criar zonas premium no encarte.
          </p>
        </div>
      )}
    </div>
  )
}
