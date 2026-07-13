'use client'
import { useState } from 'react'
import { useCatalogStore } from '@/store/catalog'
import { formatType } from '@/lib/catalog-logic'

export default function TypeLabelsEditor() {
  const { products, typeLabels, setTypeLabel } = useCatalogStore()
  const [open, setOpen] = useState(false)

  // Rótulos automáticos distintos (chave do override), com contagem de produtos
  const labelCounts = new Map<string, number>()
  for (const p of products.filter(x => !x.hidden)) {
    const auto = formatType(p.type)
    labelCounts.set(auto, (labelCounts.get(auto) || 0) + 1)
  }
  const autoLabels = Array.from(labelCounts.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  if (autoLabels.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-semibold text-[#312783] text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C8992A] inline-block" />
          Nomes das Secções
        </h3>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-400">
            Renomeie os títulos que aparecem no índice do PDF. Deixe vazio para usar o nome automático.
          </p>
          {autoLabels.map(auto => (
            <div key={auto} className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 flex items-center justify-between">
                <span className="font-medium">{auto}</span>
                <span className="text-gray-300">{labelCounts.get(auto)} prod.</span>
              </label>
              <input
                type="text"
                value={typeLabels[auto] || ''}
                onChange={e => setTypeLabel(auto, e.target.value)}
                placeholder={auto}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#312783]/20 focus:border-[#312783] transition-colors"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
