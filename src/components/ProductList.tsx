'use client'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCatalogStore } from '@/store/catalog'
import { buildPages } from '@/lib/catalog-logic'
import ProductCard from './ProductCard'

export default function ProductList() {
  const { products, pages, reorderPages, setSortMode } = useCatalogStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const allProducts = pages.flatMap(p => p.products)
  const productIds = allProducts.map(p => p.id)
  const hidden = products.filter(p => p.hidden)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    const oldIdx = productIds.indexOf(active.id as string)
    const newIdx = productIds.indexOf(over.id as string)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(allProducts, oldIdx, newIdx)
    setSortMode('manual')
    reorderPages(buildPages(reordered))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-[#1B3A5C] text-sm">
          Lista de Produtos ({allProducts.length} visíveis
          {hidden.length > 0 ? `, ${hidden.length} ocultos` : ''})
        </h3>
        <span className="text-xs text-gray-400">Arrasta para reordenar</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {allProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {allProducts.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm">Nenhum produto para mostrar.</p>
                <p className="text-xs mt-1">
                  Usa o botão &quot;Carregar do Google&quot; para importar.
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
