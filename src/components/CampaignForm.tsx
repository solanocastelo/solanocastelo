'use client'
import { useCatalogStore } from '@/store/catalog'

const INPUT_CLASS = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  )
}

export default function CampaignForm() {
  const { campaign, setCampaign } = useCatalogStore()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-[#1B3A5C] text-sm uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#C8992A] inline-block" />
        Configuração da Campanha
      </h2>

      <Field label="Título do Encarte" value={campaign.title || ''} onChange={v => setCampaign({ title: v })} placeholder="Encarte Natal 2026" />
      <Field label="Praça / Região" value={campaign.plaza || ''} onChange={v => setCampaign({ plaza: v })} placeholder="Ceará" />
      <Field label="Pagamento" value={campaign.paymentTerms || ''} onChange={v => setCampaign({ paymentTerms: v })} placeholder="60/90/120 dias" />
      <Field label="Pedido Mínimo" value={campaign.minimumOrder || ''} onChange={v => setCampaign({ minimumOrder: v })} placeholder="R$ 5.000,00" />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Validade — De
          </label>
          <input
            type="date"
            value={campaign.validityFrom}
            onChange={e => setCampaign({ validityFrom: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Validade — Até
          </label>
          <input
            type="date"
            value={campaign.validityTo}
            onChange={e => setCampaign({ validityTo: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
          />
        </div>
      </div>

      <Field
        label="Email Comercial"
        value={campaign.commercialEmail || ''}
        onChange={v => setCampaign({ commercialEmail: v })}
        placeholder="comercial@casafreitas.com.br"
        type="email"
      />
    </div>
  )
}
