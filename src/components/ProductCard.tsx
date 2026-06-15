'use client'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Product } from '@/types/catalog'
import { useCatalogStore } from '@/store/catalog'
import ImageManager from './ImageManager'

interface Props {
  product: Product
  compact?: boolean
}

export default function ProductCard({ product, compact = false }: Props) {
  const [showImageManager, setShowImageManager] = useState(false)
  const { toggleProductHidden } = useCatalogStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const imageUrl = product.customImageBase64
    ? product.customImageBase64
    : product.imageFileId
    ? `/api/drive/${product.imageFileId}`
    : null

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative bg-white overflow-hidden cursor-grab active:cursor-grabbing group flex flex-col h-full"
        {...attributes}
        {...listeners}
      >
        <div className="relative flex-1 bg-gray-100 overflow-hidden" style={{ minHeight: 0 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-300 text-3xl">📦</span>
            </div>
          )}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              setShowImageManager(true)
            }}
            className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
          >
            ✏️
          </button>
        </div>
        <div className="px-1.5 py-1 flex-shrink-0">
          <p className="text-[9px] font-semibold text-gray-800 leading-tight line-clamp-2">
            {product.name}
          </p>
          <p className="text-[8px] text-gray-400 mt-0.5">{product.code}</p>
          <p className="text-[10px] font-bold text-[#1B3A5C] mt-0.5">{product.priceFormatted}</p>
        </div>

        {showImageManager && (
          <ImageManager product={product} onClose={() => setShowImageManager(false)} />
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:border-[#1B3A5C]/40 transition-colors ${
        product.hidden ? 'opacity-40' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">
            📦
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-400">
          {product.code}
          {product.type ? ` · ${product.type}` : ''}
        </p>
        <p className="text-sm font-bold text-[#1B3A5C]">{product.priceFormatted}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            setShowImageManager(true)
          }}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 transition-colors"
        >
          Imagem
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            toggleProductHidden(product.id)
          }}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            product.hidden
              ? 'bg-[#1B3A5C] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          {product.hidden ? 'Mostrar' : 'Ocultar'}
        </button>
      </div>

      {showImageManager && (
        <ImageManager product={product} onClose={() => setShowImageManager(false)} />
      )}
    </div>
  )
}
