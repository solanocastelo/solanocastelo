'use client'
import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { useCatalogStore } from '@/store/catalog'
import CatalogPagePreview, { CoverPage } from './CatalogPagePreview'

export default function LivePreview() {
  const { pages, campaign, moveProduct } = useCatalogStore()
  const [currentPageIdx, setCurrentPageIdx] = useState(-1)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    for (let pi = 0; pi < pages.length; pi++) {
      const pos = pages[pi].products.findIndex(p => p.id === over.id)
      if (pos !== -1) {
        moveProduct(active.id as string, pi, pos)
        break
      }
    }
  }

  const currentPage = pages[currentPageIdx]
  const allProductIds = currentPage ? currentPage.products.map(p => p.id) : []

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-[#1B3A5C] text-sm flex-1">Live Preview</h2>
        <span className="text-xs text-gray-400">
          {pages.length} página(s) · Arrasta produtos para reordenar
        </span>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-2 p-3 overflow-x-auto border-b bg-gray-50/50">
        <button
          onClick={() => setCurrentPageIdx(-1)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            currentPageIdx === -1
              ? 'bg-[#1B3A5C] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Capa
        </button>
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPageIdx(i)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              currentPageIdx === i
                ? 'bg-[#1B3A5C] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pg {i + 1}
          </button>
        ))}
        {pages.length === 0 && (
          <span className="text-xs text-gray-400 py-1.5 px-2">
            Carrega produtos para ver as páginas
          </span>
        )}
      </div>

      {/* Preview Canvas */}
      <div className="flex justify-center p-8 bg-gray-100 min-h-[500px] items-center">
        {currentPageIdx === -1 ? (
          <CoverPage campaign={campaign} />
        ) : currentPage ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allProductIds} strategy={rectSortingStrategy}>
              <CatalogPagePreview
                page={currentPage}
                pageIndex={currentPageIdx}
                campaign={campaign}
              />
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-sm">Nenhum produto carregado.</p>
            <p className="text-xs mt-1">Clica em &quot;Carregar do Google&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
