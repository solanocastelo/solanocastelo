'use client'
import { useState } from 'react'
import { useCatalogStore } from '@/store/catalog'

function formatDate(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ]
  return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`
}

export default function ExportButton() {
  const [loading, setLoading] = useState(false)
  const { campaign, pages } = useCatalogStore()

  const handleExport = async () => {
    if (pages.length === 0) return
    setLoading(true)
    try {
      const validity =
        campaign.validityFrom && campaign.validityTo
          ? `De ${formatDate(campaign.validityFrom)} a ${formatDate(campaign.validityTo)}`
          : campaign.validityFrom
          ? `A partir de ${formatDate(campaign.validityFrom)}`
          : ''

      const pagesHtml = pages
        .map((page, i) => {
          const products = Array.from({ length: 6 })
            .map((_, j) => {
              const p = page.products[j]
              if (!p) return `<div class="product-slot empty"></div>`
              const imgSrc = p.customImageBase64
                ? p.customImageBase64
                : p.imageFileId
                ? `/api/drive/${p.imageFileId}`
                : null
              const imgHtml = imgSrc
                ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:contain;padding:8px;" />`
                : `<div class="no-img">📦</div>`
              const priceStr = p.priceFormatted
              const priceMatch = priceStr.match(/^(.*[,\.])(\d{2})$/)
              const priceMain = priceMatch ? priceMatch[1] : priceStr
              const priceCents = priceMatch ? priceMatch[2] : ''
              const discBadge = p.discountPercent > 0
                ? `<span class="discount-badge">${p.discountPercent}% OFF</span>`
                : ''
              const origPrice = p.discountPercent > 0
                ? `<span class="orig-price">${p.priceOriginalFormatted}</span>` : ''
              return `
            <div class="product-slot">
              <div class="product-img">${imgHtml}</div>
              <div class="product-info">
                <p class="product-name">${p.name}</p>
                <div class="price-row">
                  <div class="price-left">
                    ${origPrice}${discBadge}
                  </div>
                  <div class="code-right">
                    <span class="label">Código </span><strong>${p.code}</strong>
                  </div>
                </div>
                <div class="price-main-row">
                  <div class="price-main">
                    <span class="price-rs">R$</span>
                    <span class="price-int">${priceMain.replace('R$','').trim()}</span>
                    <span class="price-cts">${priceCents}</span>
                  </div>
                  ${p.reference ? `<div class="code-right"><span class="label">Ref. </span><strong>${p.reference}</strong></div>` : ''}
                </div>
              </div>
            </div>`
            })
            .join('')

          return `
          <div class="catalog-page">
            <div class="page-header">
              <span>CASA FREITAS</span>
              <span>Pg. ${i + 1}</span>
            </div>
            <div class="product-grid">${products}</div>
            <div class="page-footer">
              <div class="footer-item">
                <span class="footer-label">Pagamento</span>
                <span class="footer-value">${campaign.paymentTerms}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Pedido Mínimo</span>
                <span class="footer-value">${campaign.minimumOrder}</span>
              </div>
              ${
                validity
                  ? `<div class="footer-item full">
                <span class="footer-label">Validade</span>
                <span class="footer-value">${validity}</span>
              </div>`
                  : ''
              }
              <div class="footer-item">
                <span class="footer-label">Praça</span>
                <span class="footer-value">${campaign.plaza}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Contato</span>
                <span class="footer-value">${campaign.commercialEmail}</span>
              </div>
            </div>
          </div>`
        })
        .join('')

      const coverHtml = campaign.coverImageBase64
        ? `<div class="catalog-page cover-page">
            <img src="${campaign.coverImageBase64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(13,31,51,0.9),transparent);padding:60px 50px 50px;">
              <h1 style="color:white;font-size:52px;font-weight:700;line-height:1.2;">${campaign.title}</h1>
              <p style="color:rgba(255,255,255,0.6);font-size:26px;margin-top:12px;">${campaign.plaza}</p>
            </div>
          </div>`
        : ''

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { background:#e8e8e8;font-family:Arial,sans-serif; }
.catalog-page { width:1080px;height:1920px;display:flex;flex-direction:column;page-break-after:always;overflow:hidden;position:relative;background:#e8e8e8; }
.cover-page { background:#1B3A5C; }
.page-header { background:#1B3A5C;color:white;padding:20px 32px;display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:900;letter-spacing:6px;flex-shrink:0; }
.product-grid { flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:12px;padding:12px;min-height:0; }
.product-slot { background:white;display:flex;flex-direction:column;overflow:hidden;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.10); }
.product-slot.empty { background:white;border-radius:12px; }
.product-img { flex:1;overflow:hidden;background:white;min-height:0;display:flex;align-items:center;justify-content:center; }
.product-img img { width:100%;height:100%;object-fit:contain;display:block; }
.no-img { width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px;background:#f3f4f6; }
.product-info { padding:16px 18px 18px;flex-shrink:0;border-top:1px solid #f0f0f0; }
.product-name { font-size:19px;font-weight:800;color:#111;line-height:1.3;text-transform:uppercase;margin-bottom:10px; }
.price-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:4px; }
.price-left { display:flex;align-items:center;gap:8px; }
.orig-price { font-size:15px;color:#999;text-decoration:line-through; }
.discount-badge { background:#22c55e;color:white;font-size:13px;font-weight:700;padding:3px 8px;border-radius:6px; }
.price-main-row { display:flex;justify-content:space-between;align-items:flex-end; }
.price-main { display:flex;align-items:flex-start;gap:3px; }
.price-rs { font-size:16px;font-weight:700;color:#111;margin-top:4px; }
.price-int { font-size:36px;font-weight:900;color:#111;line-height:1; }
.price-cts { font-size:16px;font-weight:700;color:#111;margin-top:4px; }
.code-right { text-align:right;font-size:13px;color:#666; }
.label { color:#aaa; }
.page-footer { background:#0D1F33;color:white;padding:22px 32px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;flex-shrink:0; }
.footer-item { display:flex;flex-direction:column;gap:2px; }
.footer-item.full { grid-column:span 2; }
.footer-label { font-size:13px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px; }
.footer-value { font-size:18px;font-weight:600; }
</style></head><body>${coverHtml}${pagesHtml}</body></html>`

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewHtml: html, campaign }),
      })

      if (!response.ok) throw new Error(`PDF error: ${response.status}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `encarte-${campaign.title.replace(/\s+/g, '-').toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao gerar PDF. Verifica o console para mais detalhes.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading || pages.length === 0}
      className="w-full bg-[#C8992A] hover:bg-[#b8892a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
    >
      {loading ? (
        <>
          <span className="animate-spin inline-block">⏳</span>
          A gerar PDF...
        </>
      ) : (
        <>
          📄 Exportar PDF
          {pages.length > 0 && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {pages.length + 1} pág.
            </span>
          )}
        </>
      )}
    </button>
  )
}
