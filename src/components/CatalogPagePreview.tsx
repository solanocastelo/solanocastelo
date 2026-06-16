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
    <div className="catalog-page" id={`catalog-page-${pageIndex}`} style={{ background: '#e8e8e8' }}>
      {/* Header */}
      <div className="bg-[#312783] text-white px-3 py-1.5 flex items-center justify-between flex-shrink-0">
        <span className="text-[9px] font-black tracking-widest uppercase">Casa Freitas</span>
        <span className="text-[8px] text-white/50">Pg. {pageIndex + 1}</span>
      </div>

      {/* 2×3 Grid com cards brancos e espaçamento */}
      <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-1.5 p-1.5 min-h-0">
        {Array.from({ length: 6 }).map((_, i) => {
          const product = page.products[i]
          if (!product) {
            return (
              <div
                key={i}
                className="bg-white rounded-lg flex items-center justify-center"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
              >
                <span className="text-gray-200 text-xl">＋</span>
              </div>
            )
          }
          return (
            <div
              key={product.id}
              className="rounded-lg overflow-hidden"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
            >
              <ProductCard product={product} compact />
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="bg-[#0D1F33] text-white px-3 py-2 flex-shrink-0">
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>
            <p className="text-[6px] text-white/40 uppercase tracking-wider">Pagamento</p>
            <p className="text-[8px] font-semibold leading-tight">{campaign.paymentTerms}</p>
          </div>
          <div>
            <p className="text-[6px] text-white/40 uppercase tracking-wider">Pedido Mínimo</p>
            <p className="text-[8px] font-semibold leading-tight">{campaign.minimumOrder}</p>
          </div>
          {validity && (
            <div className="col-span-2">
              <p className="text-[6px] text-white/40 uppercase tracking-wider">Validade</p>
              <p className="text-[8px] font-semibold leading-tight">{validity}</p>
            </div>
          )}
          <div>
            <p className="text-[6px] text-white/40 uppercase tracking-wider">Praça</p>
            <p className="text-[8px] font-semibold leading-tight">{campaign.plaza}</p>
          </div>
          <div>
            <p className="text-[6px] text-white/40 uppercase tracking-wider">Contato</p>
            <p className="text-[8px] font-semibold leading-tight truncate">{campaign.commercialEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
