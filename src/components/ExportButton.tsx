'use client'
import { useState } from 'react'
import { useCatalogStore } from '@/store/catalog'

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

function formatDate(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`
}

/* Page: 1080×1920. Header:60px Footer:130px Grid:1730px */
/* Grid inner: 1730-24pad=1706, -24gaps=1682, /3=560px per row */
/* Card width: 1080-24pad-12gap=1044, /2=522px */
const PAGE_CSS = `
* { margin:0;padding:0;box-sizing:border-box; }
body { background:#e8e8e8;font-family:Arial,sans-serif; }
.catalog-page { width:1080px;height:1920px;overflow:hidden;position:relative;background:#e8e8e8; }
.cover-page { background:#312783; }
.page-header { width:1080px;height:60px;background:#312783;color:white;padding:0 32px;display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:900;letter-spacing:6px; }
.product-grid { width:1080px;height:1730px;display:grid;grid-template-columns:522px 522px;grid-template-rows:560px 560px 560px;gap:12px;padding:12px; }
.product-slot { width:522px;height:560px;background:white;overflow:hidden;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.10); }
.product-slot.empty { background:white;border-radius:12px; }
.product-img { width:522px;height:292px;overflow:hidden;background:white;display:flex;align-items:center;justify-content:center; }
.product-img img { max-width:500px;max-height:280px;width:auto;height:auto;display:block; }
.no-img { width:522px;height:292px;display:flex;align-items:center;justify-content:center;font-size:80px;background:#f3f4f6; }
.product-info { width:522px;height:268px;padding:10px 16px 12px;border-top:1px solid #f0f0f0;overflow:hidden; }
.product-name { font-size:16px;font-weight:800;color:#111;line-height:1.25;margin-bottom:8px;height:40px;overflow:hidden; }
.price-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:4px; }
.price-left { display:flex;align-items:center;gap:6px; }
.orig-price { font-size:13px;color:#999;text-decoration:line-through; }
.discount-badge { background:#22c55e;color:white;font-size:12px;font-weight:700;padding:2px 7px;border-radius:5px; }
.price-main-row { display:flex;justify-content:space-between;align-items:flex-end; }
.price-main { display:flex;align-items:flex-start;gap:2px; }
.price-rs { font-size:15px;font-weight:700;color:#111;margin-top:3px; }
.price-int { font-size:34px;font-weight:900;color:#111;line-height:1; }
.price-cts { font-size:15px;font-weight:700;color:#111;margin-top:3px; }
.code-right { text-align:right;font-size:12px;color:#666; }
.label { color:#aaa; }
.caixa-pill { display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border-radius:6px;padding:2px 7px;margin-top:5px; }
.caixa-pill-text { font-size:13px;font-weight:600;color:#1d4ed8; }
.page-footer { width:1080px;height:130px;background:#0D1F33;color:white;padding:16px 32px;display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;overflow:hidden; }
.footer-item { display:flex;flex-direction:column;gap:2px; }
.footer-item.full { grid-column:span 2; }
.footer-label { font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px; }
.footer-value { font-size:16px;font-weight:600; }
`

export default function ExportButton() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { campaign, pages } = useCatalogStore()

  const handleExport = async () => {
    if (pages.length === 0) return
    setLoading(true)
    setProgress(0)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      // Pre-fetch Drive images as base64
      const allProducts = pages.flatMap(p => p.products)
      const imageCache: Record<string, string> = {}
      await Promise.all(
        allProducts
          .filter(p => p.imageFileId && !p.customImageBase64)
          .map(async p => {
            const b64 = await fetchBase64(`/api/drive/${p.imageFileId}`)
            if (b64) imageCache[p.imageFileId!] = b64
          })
      )

      const validity =
        campaign.validityFrom && campaign.validityTo
          ? `De ${formatDate(campaign.validityFrom)} a ${formatDate(campaign.validityTo)}`
          : campaign.validityFrom ? `A partir de ${formatDate(campaign.validityFrom)}` : ''

      // Build array of page HTML strings
      const allPageHtmls: string[] = []

      // Cover page
      if (campaign.coverImageBase64) {
        allPageHtmls.push(`
          <div class="catalog-page cover-page">
            <img src="${campaign.coverImageBase64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(13,31,51,0.9),transparent);padding:60px 50px 50px;">
              <h1 style="color:white;font-size:52px;font-weight:700;line-height:1.2;">${campaign.title}</h1>
              <p style="color:rgba(255,255,255,0.6);font-size:26px;margin-top:12px;">${campaign.plaza}</p>
            </div>
          </div>`)
      }

      // Product pages
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const slots = Array.from({ length: 6 }).map((_, j) => {
          const p = page.products[j]
          if (!p) return `<div class="product-slot empty"></div>`
          const imgSrc = p.customImageBase64 || (p.imageFileId && imageCache[p.imageFileId]) || null
          const imgHtml = imgSrc
            ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:contain;padding:8px;" />`
            : `<div class="no-img">📦</div>`
          const priceMatch = p.priceFormatted.match(/^(.*[,\.])(\d{2})$/)
          const priceMain = priceMatch ? priceMatch[1] : p.priceFormatted
          const priceCents = priceMatch ? priceMatch[2] : ''
          return `
            <div class="product-slot">
              <div class="product-img">${imgHtml}</div>
              <div class="product-info">
                <p class="product-name">${p.name}</p>
                <div class="price-row">
                  <div class="price-left">
                    ${p.discountPercent > 0 ? `<span class="orig-price">${p.priceOriginalFormatted}</span><span class="discount-badge">${p.discountPercent}% OFF</span>` : ''}
                  </div>
                  <div class="code-right"><span class="label">Código </span><strong>${p.code}</strong></div>
                </div>
                <div class="price-main-row">
                  <div class="price-main">
                    <span class="price-rs">R$</span>
                    <span class="price-int">${priceMain.replace('R$', '').trim()}</span>
                    <span class="price-cts">${priceCents}</span>
                  </div>
                  ${p.reference ? `<div class="code-right"><span class="label">Ref. </span><strong>${p.reference}</strong></div>` : ''}
                </div>
                ${p.caixaMaster ? `<div class="caixa-pill"><span>📦</span><span class="caixa-pill-text">Cx. Master ${p.caixaMaster} peças</span></div>` : ''}
              </div>
            </div>`
        }).join('')

        allPageHtmls.push(`
          <div class="catalog-page">
            <div class="page-header"><span>CASA FREITAS</span><span>Pg. ${i + 1}</span></div>
            <div class="product-grid">${slots}</div>
            <div class="page-footer">
              <div class="footer-item"><span class="footer-label">Pagamento</span><span class="footer-value">${campaign.paymentTerms}</span></div>
              <div class="footer-item"><span class="footer-label">Pedido Mínimo</span><span class="footer-value">${campaign.minimumOrder}</span></div>
              ${validity ? `<div class="footer-item full"><span class="footer-label">Validade</span><span class="footer-value">${validity}</span></div>` : ''}
              <div class="footer-item"><span class="footer-label">Praça</span><span class="footer-value">${campaign.plaza}</span></div>
              <div class="footer-item"><span class="footer-label">Contato</span><span class="footer-value">${campaign.commercialEmail}</span></div>
            </div>
          </div>`)
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1920] })

      // Render each page
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1080px;height:1920px;overflow:hidden;z-index:-1;'
      const style = document.createElement('style')
      style.textContent = PAGE_CSS
      container.appendChild(style)
      const inner = document.createElement('div')
      container.appendChild(inner)
      document.body.appendChild(container)

      for (let i = 0; i < allPageHtmls.length; i++) {
        inner.innerHTML = allPageHtmls[i]
        // Wait for images
        await Promise.all(
          Array.from(inner.querySelectorAll('img')).map(img =>
            (img as HTMLImageElement).complete
              ? Promise.resolve()
              : new Promise(r => { (img as HTMLImageElement).onload = r; (img as HTMLImageElement).onerror = r })
          )
        )
        // Small delay for layout
        await new Promise(r => setTimeout(r, 50))

        const canvas = await html2canvas(inner.firstElementChild as HTMLElement, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          width: 1080,
          height: 1920,
          backgroundColor: '#e8e8e8',
          logging: false,
        })

        if (i > 0) pdf.addPage([1080, 1920], 'portrait')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.55), 'JPEG', 0, 0, 1080, 1920)
        setProgress(Math.round(((i + 1) / allPageHtmls.length) * 100))
      }

      document.body.removeChild(container)

      const title = campaign.title.replace(/\s+/g, '-').toLowerCase()
      pdf.save(`encarte-${title}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF. Verifica o console para mais detalhes.')
      console.error(err)
    } finally {
      setLoading(false)
      setProgress(0)
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
          {progress > 0 ? `A gerar PDF... ${progress}%` : 'A preparar...'}
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
