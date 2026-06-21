'use client'
import { CatalogPage, CampaignConfig } from '@/types/catalog'
import ProductCard from './ProductCard'

interface Props {
  page: CatalogPage
  pageIndex: number
  campaign: CampaignConfig
}

function formatValidity(from: string, to: string): string {
  const fmt = (d: string) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`
  }
  if (from && to) return `De ${fmt(from)} a ${fmt(to)}`
  if (from) return `A partir de ${fmt(from)}`
  if (to) return `Até ${fmt(to)}`
  return ''
}

export function CoverPage({ campaign }: { campaign: CampaignConfig }) {
  return (
    <div className="catalog-page bg-[#312783]">
      {campaign.coverImageBase64 ? (
        <img
          src={campaign.coverImageBase64}
          alt="Capa"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-6xl mb-4">🎄</div>
          <h1 className="text-2xl font-bold text-center px-8">
            {campaign.title || 'Encarte Casa Freitas'}
          </h1>
          <p className="text-sm mt-2 text-white/50">Casa Freitas · {campaign.plaza}</p>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0D1F33]/90 to-transparent p-6 z-10">
        <h1 className="text-white font-bold text-xl leading-tight">{campaign.title}</h1>
        <p className="text-white/60 text-xs mt-1">{campaign.plaza}</p>
      </div>
    </div>
  )
}

export default function CatalogPagePreview({ page, pageIndex, campaign }: Props) {
  const validity = formatValidity(campaign.validityFrom, campaign.validityTo)

  return (
    <div className="catalog-page" id={`catalog-page-${pageIndex}`} style={{ background: '#003dac' }}>
      {/* Header */}
      <div className="bg-[#312783] text-white px-3 py-2 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* CF logo */}
          <svg className="h-[14px] w-auto flex-shrink-0" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(-12,110,60)">
              <rect x="18" y="22" width="184" height="96" rx="16" ry="16" fill="#ffe600" stroke="#e8000d" strokeWidth="8"/>
              <circle cx="110" cy="14" r="9" fill="none" stroke="#d0d0d0" strokeWidth="4"/>
              <line x1="110" y1="23" x2="110" y2="30" stroke="#d0d0d0" strokeWidth="4"/>
              <text x="110" y="90" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontSize="68" fontWeight="900" fill="#e8000d" letterSpacing="-2">CF</text>
            </g>
          </svg>
          <span className="w-px h-3 bg-white/30 flex-shrink-0" />
          <span className="text-[7px] text-white/70 truncate">Encarte de Ofertas B2B</span>
        </div>
        <span className="text-[7px] font-bold bg-white/15 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
          Pg. {pageIndex + 1}
        </span>
      </div>

      {/* 2×2 Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 min-h-0">
        {Array.from({ length: 4 }).map((_, i) => {
          const product = page.products[i]
          if (!product) {
            return (
              <div
                key={i}
                className="bg-white rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-200 text-xl">＋</span>
              </div>
            )
          }
          return (
            <div
              key={product.id}
              className="rounded-lg overflow-hidden"
            >
              <ProductCard product={product} compact />
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="bg-[#002d96] text-white px-4 py-2 flex-shrink-0 flex items-center justify-between gap-3">
        {[
          ['Pagamento', campaign.paymentTerms],
          ['Pedido Mín.', campaign.minimumOrder],
          ...(validity ? [['Validade', validity]] : []),
          ['Praça', campaign.plaza],
          ['Contato', campaign.commercialEmail],
        ].map(([l, v], i) => (
          <div key={l} className="flex items-center gap-3">
            {i > 0 && <div className="w-px h-6 bg-white/15 flex-shrink-0" />}
            <div className="flex flex-col min-w-0">
              <span className="text-[5px] text-white/40 uppercase tracking-wider whitespace-nowrap">{l}</span>
              <span className="text-[7px] font-bold truncate max-w-[70px]">{v}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
