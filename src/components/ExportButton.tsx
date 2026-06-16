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

const PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;background:#e8e8e8;}
.page{width:1080px;height:1920px;display:flex;flex-direction:column;overflow:hidden;background:#e8e8e8;}
.cover-page{background:#312783;}

/* HEADER */
.page-header{flex:none;height:96px;padding:0 36px;display:flex;align-items:center;justify-content:space-between;background:#312783;color:#fff;}
.brand{display:flex;align-items:center;gap:16px;}
.brand b{font-size:30px;font-weight:800;letter-spacing:.02em;}
.sep{width:1px;height:30px;background:rgba(255,255,255,.35);}
.sub{font-size:16px;font-weight:500;opacity:.9;}
.pg{font-size:18px;font-weight:700;background:rgba(255,255,255,.14);padding:8px 18px;border-radius:999px;}

/* GRID */
.grid{flex:1 1 auto;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:22px;padding:24px;min-height:0;}

/* CARD */
.card{background:#fff;border-radius:14px;box-shadow:0 2px 14px rgba(0,0,0,.10);overflow:hidden;display:flex;flex-direction:column;}

/* PHOTO — frame sempre 1:1, imagem nunca distorce */
.photo{position:relative;background:#fafafa;display:flex;align-items:center;justify-content:center;padding:14px;flex:0 0 auto;}
.frame{width:100%;aspect-ratio:1/1;background:#f4f4f4;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px;}
.frame img{width:100%;height:100%;object-fit:contain;}
.no-photo{font-size:60px;}
.badge{position:absolute;top:12px;left:12px;background:#1faa4d;color:#fff;font-size:12px;font-weight:800;padding:5px 10px;border-radius:7px;}

/* INFO */
.info{flex:1;border-top:1px solid #ececec;padding:14px 16px 15px;display:flex;flex-direction:column;gap:9px;overflow:hidden;}
.name{font-weight:700;font-size:14px;line-height:1.25;color:#1f1f1f;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.price{display:flex;flex-direction:column;gap:2px;}
.was{font-size:12px;color:#9a9a9a;text-decoration:line-through;}
.now{display:flex;align-items:baseline;color:#161616;line-height:1;gap:3px;}
.cur{font-size:15px;font-weight:700;}
.int{font-size:34px;font-weight:800;letter-spacing:-1px;}
.dec{font-size:16px;font-weight:700;}
.pill{display:inline-flex;align-items:center;gap:6px;background:#e7effb;color:#1c3f86;font-weight:600;font-size:11px;padding:4px 10px;border-radius:999px;width:fit-content;}
.meta{display:flex;align-items:center;gap:12px;border-top:1px solid #eee;padding-top:8px;font-size:11px;color:#8a8a8a;}
.meta b{color:#444;font-weight:700;}

/* FOOTER */
.page-footer{flex:none;height:150px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;gap:24px;background:#1d1d1f;color:#fff;}
.fcol{display:flex;flex-direction:column;gap:5px;}
.flbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9a9c;}
.fval{font-size:16px;font-weight:700;}
.fsep{width:1px;height:64px;background:rgba(255,255,255,.14);}
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

      const footerCols = [
        ['Pagamento', campaign.paymentTerms],
        ['Pedido Mínimo', campaign.minimumOrder],
        ...(validity ? [['Validade', validity]] : []),
        ['Praça', campaign.plaza],
        ['Contato', campaign.commercialEmail],
      ]

      const footerHtml = footerCols.map(([l, v], i) => `
        ${i ? '<div class="fsep"></div>' : ''}
        <div class="fcol"><div class="flbl">${l}</div><div class="fval">${v}</div></div>
      `).join('')

      // Build page HTML strings
      const allPageHtmls: string[] = []

      // Cover
      if (campaign.coverImageBase64) {
        allPageHtmls.push(`
          <div class="page cover-page" style="position:relative;">
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
        const slots = Array.from({ length: 4 }).map((_, j) => {
          const p = page.products[j]
          if (!p) return `<div class="card" style="background:#f9f9f9;border-radius:14px;"></div>`

          const imgSrc = p.customImageBase64 || (p.imageFileId && imageCache[p.imageFileId]) || null
          const imgHtml = imgSrc
            ? `<img src="${imgSrc}" alt="" />`
            : `<span class="no-photo">📦</span>`

          const priceMatch = p.priceFormatted.match(/^R?\$?\s*([\d.]+)[,.](\d{2})$/)
          const int = priceMatch ? priceMatch[1] : p.priceFormatted.replace('R$','').trim()
          const dec = priceMatch ? priceMatch[2] : ''

          return `
            <div class="card">
              <div class="photo">
                <div class="frame">${imgHtml}</div>
                ${p.discountPercent > 0 ? `<div class="badge">${p.discountPercent}% OFF</div>` : ''}
              </div>
              <div class="info">
                <div class="name">${p.name}</div>
                <div class="price">
                  ${p.discountPercent > 0 ? `<span class="was">${p.priceOriginalFormatted}</span>` : ''}
                  <div class="now"><span class="cur">R$</span><span class="int">${int}</span><span class="dec">,${dec}</span></div>
                </div>
                ${p.caixaMaster ? `<div class="pill">📦 Cx. Master ${p.caixaMaster} peças</div>` : ''}
                <div class="meta"><span>Cód. <b>${p.code}</b></span><span>Ref. <b>${p.reference}</b></span></div>
              </div>
            </div>`
        }).join('')

        allPageHtmls.push(`
          <div class="page">
            <header class="page-header">
              <div class="brand"><b>CASA FREITAS</b><span class="sep"></span><span class="sub">Encarte B2B</span></div>
              <div class="pg">Pg. ${i + 1} / ${pages.length}</div>
            </header>
            <div class="grid">${slots}</div>
            <footer class="page-footer">${footerHtml}</footer>
          </div>`)
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1920] })

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1080px;height:1920px;overflow:hidden;z-index:-1;'
      const styleEl = document.createElement('style')
      styleEl.textContent = PAGE_CSS
      container.appendChild(styleEl)
      const inner = document.createElement('div')
      container.appendChild(inner)
      document.body.appendChild(container)

      for (let i = 0; i < allPageHtmls.length; i++) {
        inner.innerHTML = allPageHtmls[i]
        await Promise.all(
          Array.from(inner.querySelectorAll('img')).map(img => {
            const el = img as HTMLImageElement
            if (el.complete) return Promise.resolve()
            return new Promise<void>(r => { el.onload = () => r(); el.onerror = () => r() })
          })
        )
        await new Promise(r => setTimeout(r, 80))

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
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.60), 'JPEG', 0, 0, 1080, 1920)
        setProgress(Math.round(((i + 1) / allPageHtmls.length) * 100))
      }

      document.body.removeChild(container)
      pdf.save(`encarte-${campaign.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
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
