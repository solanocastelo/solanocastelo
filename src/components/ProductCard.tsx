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
  const match = formatted.match(/^(.*[,\.])(\d{2})$/)
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
    // Card no encarte 9:16 — versão compacta fiel à referência
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white flex flex-col h-full cursor-grab active:cursor-grabbing group relative"
        {...attributes}
        {...listeners}
      >
        {/* Imagem */}
        <div className="relative bg-white overflow-hidden" style={{ flex: '1 1 52%', minHeight: 0 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <svg className="w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
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
        <div className="flex-shrink-0 px-1.5 pb-1.5 pt-1 border-t border-gray-100" style={{ flex: '0 0 48%' }}>
          {/* Nome */}
          <p className="text-[7.5px] font-bold text-gray-900 uppercase leading-tight line-clamp-2 mb-1">
            {product.name}
          </p>

          {/* Preço Tabela + Desconto | Código */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1">
              {hasDiscount && (
                <span className="text-[7px] text-gray-400 line-through leading-none">
                  {product.priceOriginalFormatted}
                </span>
              )}
              {hasDiscount && (
                <span className="bg-green-500 text-white text-[6px] font-bold px-1 py-0.5 rounded leading-none">
                  {product.discountPercent}% OFF
                </span>
              )}
            </div>
            <span className="text-[6.5px] text-gray-500 leading-none text-right">
              <span className="text-gray-400">Cód. </span>
              <span className="font-bold text-gray-700">{product.code}</span>
            </span>
          </div>

          {/* Preço Principal | Referência */}
          <div className="flex items-end justify-between gap-1">
            <div className="flex items-start leading-none">
              <span className="text-[8px] font-bold text-gray-900 mt-0.5">R$</span>
              <span className="text-[14px] font-black text-gray-900 mx-0.5 leading-none">{priceMain.replace('R$','').trim()}</span>
              <span className="text-[8px] font-bold text-gray-900 mt-0.5">{priceCents}</span>
            </div>
            {product.reference && (
              <span className="text-[6.5px] text-gray-500 text-right leading-none">
                <span className="text-gray-400">Ref. </span>
                <span className="font-bold text-gray-700">{product.reference}</span>
              </span>
            )}
          </div>

          {/* Caixa Master */}
          {product.caixaMaster && (
            <div className="mt-1 flex items-center gap-0.5 bg-blue-50 rounded px-1.5 py-0.5 w-fit">
              <span className="text-[7px]">📦</span>
              <span className="text-[6.5px] font-semibold text-blue-700">Cx. Master {product.caixaMaster} peças</span>
            </div>
          )}
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
      className={`flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all ${
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
