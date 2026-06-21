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

// Divide "R$ 10,49" → ["R$ 10", "49"]
function splitPrice(formatted: string) {
  const match = formatted.match(/^(.*[,\\.])(\d{2})$/)
  if (!match) return { main: formatted, cents: '' }
  return { main: match[1], cents: match[2] }
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

  const { main: priceMain, cents: priceCents } = splitPrice(product.priceFormatted)
  const hasDiscount = product.discountPercent > 0

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white flex flex-col h-full cursor-grab active:cursor-grabbing group relative overflow-hidden rounded-[inherit]"
        {...attributes}
        {...listeners}
      >
        {/* Photo area — square 1:1, image never distorts */}
        <div className="relative flex-shrink-0 bg-[#fafafa] p-2">
          <div className="w-full aspect-square bg-[#f4f4f4] rounded overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl">📦</span>
            )}
          </div>
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-[#1faa4d] text-white text-[6px] font-black px-1.5 py-0.5 rounded-[3px] leading-none shadow-sm">
              {product.discountPercent}% OFF
            </div>
          )}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setShowImageManager(true) }}
            className="absolute top-1 right-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] leading-none"
          >
            ✏️
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 border-t border-gray-100 px-2 py-1.5 flex flex-col gap-1 min-h-0 overflow-hidden">
          <p className="text-[7px] font-bold text-[#1f1f1f] leading-tight line-clamp-2">
            {product.name}
          </p>
          <div className="flex flex-col gap-0.5">
            {hasDiscount && (
              <span className="text-[6px] text-[#9a9a9a] line-through leading-none">
                {product.priceOriginalFormatted}
              </span>
            )}
            <div className="flex items-baseline leading-none gap-px">
              <span className="text-[6.5px] font-bold text-[#161616]">R$</span>
              <span className="text-[13px] font-black text-[#161616] leading-none tracking-tight">{priceMain.replace('R$','').trim()}</span>
              <span className="text-[7px] font-bold text-[#161616]">,{priceCents}</span>
            </div>
          </div>
          {product.caixaMaster && (
            <div className="flex items-center gap-1 bg-[#e7effb] text-[#1c3f86] font-bold text-[5.5px] px-1.5 py-[2px] rounded-full w-fit leading-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1c3f86" strokeWidth="2.2" strokeLinejoin="round" className="w-2 h-2 flex-shrink-0"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>
              Cx. Master {product.caixaMaster} pç
            </div>
          )}
          <div className="flex items-center gap-1.5 border-t border-gray-100 pt-1 text-[5.5px] text-[#8a8a8a] mt-auto">
            <span>Cód. <b className="text-[#444]">{product.code}</b></span>
            {product.reference && <span>Ref. <b className="text-[#444]">{product.reference}</b></span>}
          </div>
        </div>

        {showImageManager && (
          <ImageManager product={product} onClose={() => setShowImageManager(false)} />
        )}
      </div>
    )
  }

  // Lista (painel lateral)
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing hover:border-[#312783]/30 hover:shadow-sm transition-all ${
        product.hidden ? 'opacity-40' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-xl">📦</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 uppercase truncate leading-tight">{product.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {product.code}
          {product.reference ? ` · Ref. ${product.reference}` : ''}
          {product.type ? ` · ${product.type}` : ''}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through">{product.priceOriginalFormatted}</span>
          )}
          <span className="text-sm font-black text-gray-900">{product.priceFormatted}</span>
          {hasDiscount && (
            <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setShowImageManager(true) }}
          className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-600 transition-colors"
        >
          Imagem
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); toggleProductHidden(product.id) }}
          className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
            product.hidden
              ? 'bg-[#312783] text-white'
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
