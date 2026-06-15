'use client'
import { useRef } from 'react'
import { useCatalogStore } from '@/store/catalog'

export default function CoverUpload() {
  const { campaign, setCampaign } = useCatalogStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCampaign({ coverImageBase64: reader.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="font-semibold text-[#1B3A5C] text-sm uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#C8992A] inline-block" />
        Imagem da Capa
      </h2>

      {campaign.coverImageBase64 ? (
        <div className="relative rounded-xl overflow-hidden group">
          <img
            src={campaign.coverImageBase64}
            alt="Capa"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              Substituir
            </button>
            <button
              onClick={() => setCampaign({ coverImageBase64: undefined })}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#1B3A5C]/40 hover:bg-blue-50/30 transition-all"
        >
          <div className="text-3xl mb-2">🖼️</div>
          <p className="text-sm text-gray-500">Clica para upload da imagem de capa</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG · Proporção ideal: 9:16</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
