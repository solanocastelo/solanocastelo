'use client'
import { useState } from 'react'
import { useCatalogStore } from '@/store/catalog'

export default function MissingImages() {
  const products = useCatalogStore(s => s.products)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const missing = products.filter(p => !p.hasImage && !p.hidden)
  if (missing.length === 0) return null

  const codeList = missing.map(p => p.code).join('\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          {missing.length} produto{missing.length !== 1 ? 's' : ''} sem foto
        </span>
        <span className="text-amber-400 text-xs">{open ? '▲ Fechar' : '▼ Ver códigos'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Lista de códigos</span>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#312783] text-white hover:bg-[#312783]/80'
              }`}
            >
              {copied ? '✓ Copiado!' : 'Copiar todos'}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {missing.map(p => (
                <span
                  key={p.id}
                  className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded font-mono"
                >
                  {p.code}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Clique em "Copiar todos" para copiar os códigos separados por linha.
          </p>
        </div>
      )}
    </div>
  )
}
