'use client'
import { useState } from 'react'
import { useCatalogStore } from '@/store/catalog'

function formatDate(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`
}

function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const BOX_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#1c3f86" stroke-width="2.2" stroke-linejoin="round" style="width:16px;height:16px;flex:none;vertical-align:middle;"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>`

/* ─── PAGE CSS ─────────────────────────────────────────────────────────────
   Built for html2canvas at scale:1 (1080×1920, 72 dpi).
   IMPORTANT: NO aspect-ratio — the JS fixPhotoHeights() call replaces it
   with an explicit pixel height before the canvas capture.
──────────────────────────────────────────────────────────────────────────── */
const PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;background:#e8e8e8;}
.page{width:1080px;height:1920px;overflow:hidden;background:#e8e8e8;display:flex;flex-direction:column;}

/* HEADER */
.ph{flex:none;height:96px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;background:#312783;color:#fff;}
.brand{display:flex;align-items:center;gap:18px;}
.brand b{font-size:32px;font-weight:900;letter-spacing:.02em;}
.hsep{width:1px;height:32px;background:rgba(255,255,255,.35);}
.sub{font-size:18px;font-weight:500;opacity:.85;}
.pgn{font-size:19px;font-weight:700;background:rgba(255,255,255,.15);padding:9px 20px;border-radius:999px;}

/* GRID — auto rows so cards size to content */
.grid{flex:1;display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:auto;align-content:space-evenly;align-items:start;gap:30px;padding:34px;}

/* CARD */
.card{background:#fff;border-radius:16px;box-shadow:0 3px 18px rgba(0,0,0,.11);overflow:hidden;display:flex;flex-direction:column;}

/* PHOTO — height set explicitly by JS before canvas capture */
.photo{position:relative;background:#fafafa;width:100%;overflow:hidden;
  background-image:repeating-linear-gradient(45deg,#ececec 0 14px,#f7f7f7 14px 28px);}
.photo img{width:100%;height:100%;object-fit:contain;display:block;}
.photo .nophoto{width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  font-family:Menlo,Consolas,monospace;font-size:14px;color:#a4a4a4;letter-spacing:.08em;text-transform:uppercase;}

/* BADGE */
.badge{position:absolute;top:18px;left:18px;
  background:#1faa4d;color:#fff;
  font-size:16px;font-weight:900;padding:9px 16px;border-radius:10px;
  box-shadow:0 3px 10px rgba(31,170,77,.4);letter-spacing:.02em;}

/* INFO */
.info{border-top:1px solid #ececec;padding:20px 22px 22px;display:flex;flex-direction:column;gap:14px;}
.name{font-weight:700;font-size:18px;line-height:1.3;color:#1f1f1f;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:46px;}
.price{display:flex;flex-direction:column;gap:3px;}
.was{font-size:14px;color:#9a9a9a;text-decoration:line-through;}
.now{display:flex;align-items:baseline;color:#161616;line-height:1;gap:4px;}
.cur{font-size:20px;font-weight:700;}
.int{font-size:48px;font-weight:900;letter-spacing:-2px;}
.dec{font-size:22px;font-weight:700;}
.pill{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;
  background:#e7effb;color:#1c3f86;font-weight:700;font-size:14px;
  padding:7px 16px;border-radius:999px;width:fit-content;}
.meta{display:flex;align-items:center;gap:16px;border-top:1px solid #eee;
  padding-top:12px;font-size:13px;color:#8a8a8a;}
.meta b{color:#444;font-weight:700;}

/* FOOTER */
.ft{flex:none;height:152px;padding:0 44px;display:flex;align-items:center;
  justify-content:space-between;gap:24px;background:#1d1d1f;color:#fff;}
.fcol{display:flex;flex-direction:column;gap:5px;}
.flbl{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9a9a9c;}
.fval{font-size:18px;font-weight:700;}
.fsep{width:1px;height:64px;background:rgba(255,255,255,.14);}
`

function buildPageHtml(cards: string, headerHtml: string, footerHtml: string) {
  return `<div class="page"><div class="ph">${headerHtml}</div><div class="grid">${cards}</div><div class="ft">${footerHtml}</div></div>`
}

export default function ExportButton() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const { campaign, pages } = useCatalogStore()

  const handleExport = async () => {
    if (pages.length === 0) return
    setLoading(true)
    setProgress('A preparar…')
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const validity =
        campaign.validityFrom && campaign.validityTo
          ? `De ${formatDate(campaign.validityFrom)} a ${formatDate(campaign.validityTo)}`
          : campaign.validityFrom ? `A partir de ${formatDate(campaign.validityFrom)}` : ''

      const footerCols: [string, string][] = [
        ['Pagamento', campaign.paymentTerms],
        ['Pedido Mínimo', campaign.minimumOrder],
        ...(validity ? [['Validade', validity] as [string, string]] : []),
        ['Praça', campaign.plaza],
        ['Contato', campaign.commercialEmail],
      ]
      const footerHtml = footerCols.map(([l, v], i) => `
        ${i ? '<div class="fsep"></div>' : ''}
        <div class="fcol"><div class="flbl">${escapeHtml(l)}</div><div class="fval">${escapeHtml(v)}</div></div>
      `).join('')

      const totalPdfPages = pages.length + (campaign.coverImageBase64 ? 1 : 0)
      const allPageHtmls: string[] = []

      // Cover
      if (campaign.coverImageBase64) {
        allPageHtmls.push(`
          <div class="page" style="background:#312783;position:relative;">
            <img src="${campaign.coverImageBase64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(13,31,51,.9),transparent);padding:64px 52px 52px;">
              <h1 style="color:#fff;font-size:56px;font-weight:800;line-height:1.2;margin:0;">${escapeHtml(campaign.title)}</h1>
              <p style="color:rgba(255,255,255,.65);font-size:28px;margin:14px 0 0;">${escapeHtml(campaign.plaza)}</p>
            </div>
          </div>`)
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const cards = Array.from({ length: 4 }).map((_, j) => {
          const p = page.products[j]
          if (!p) return `<div class="card" style="background:#f4f4f4;box-shadow:none;border-radius:16px;"></div>`

          const imgSrc = p.customImageBase64
            ? p.customImageBase64
            : p.imageFileId ? `/api/drive/${p.imageFileId}` : null

          const imgHtml = imgSrc
            ? `<img src="${imgSrc}" crossorigin="anonymous" />`
            : `<div class="nophoto">Foto do produto</div>`

          const priceMatch = p.priceFormatted.match(/^R?\$?\s*([\d.]+)[,.](\d{2})$/)
          const int = priceMatch ? priceMatch[1] : p.priceFormatted.replace('R$','').trim()
          const dec = priceMatch ? priceMatch[2] : '00'

          const pill = p.caixaMaster
            ? `<div class="pill">${BOX_ICON}&nbsp;Caixa Master ${escapeHtml(p.caixaMaster)} peças</div>`
            : ''

          const pageNum = i + 1 + (campaign.coverImageBase64 ? 1 : 0)
          void pageNum

          return `
            <div class="card">
              <div class="photo">${imgHtml}${p.discountPercent > 0 ? `<div class="badge">${p.discountPercent}% OFF</div>` : ''}</div>
              <div class="info">
                <div class="name">${escapeHtml(p.name)}</div>
                <div class="price">
                  ${p.discountPercent > 0 ? `<span class="was">${escapeHtml(p.priceOriginalFormatted)}</span>` : ''}
                  <div class="now"><span class="cur">R$</span><span class="int">${int}</span><span class="dec">,${dec}</span></div>
                </div>
                ${pill}
                <div class="meta"><span>Cód. <b>${escapeHtml(p.code)}</b></span><span>Ref. <b>${escapeHtml(p.reference)}</b></span></div>
              </div>
            </div>`
        }).join('')

        const pageNum = i + 1 + (campaign.coverImageBase64 ? 1 : 0)
        const headerHtml = `
          <div class="brand"><b>CASA FREITAS</b><span class="hsep"></span><span class="sub">Encarte de Ofertas B2B</span></div>
          <div class="pgn">Pg. ${pageNum} / ${totalPdfPages}</div>`

        allPageHtmls.push(buildPageHtml(cards, headerHtml, footerHtml))
      }

      // Hidden container at exactly 1080px
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1080px;z-index:-1;'
      const styleEl = document.createElement('style')
      styleEl.textContent = PAGE_CSS
      container.appendChild(styleEl)
      const inner = document.createElement('div')
      container.appendChild(inner)
      document.body.appendChild(container)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1920] })

      for (let i = 0; i < allPageHtmls.length; i++) {
        setProgress(`Página ${i + 1} / ${allPageHtmls.length}…`)
        inner.innerHTML = allPageHtmls[i]

        // Wait for images
        await Promise.all(
          Array.from(inner.querySelectorAll('img')).map(img => {
            const el = img as HTMLImageElement
            if (el.complete && el.naturalWidth > 0) return Promise.resolve()
            return new Promise<void>(r => { el.onload = () => r(); el.onerror = () => r() })
          })
        )

        // KEY FIX: replace CSS aspect-ratio with explicit px height (html2canvas workaround)
        inner.querySelectorAll<HTMLElement>('.photo').forEach(el => {
          el.style.height = el.offsetWidth + 'px'
        })

        await new Promise(r => setTimeout(r, 60))

        const canvas = await html2canvas(inner.firstElementChild as HTMLElement, {
          scale: 1,          // 1:1 → 1080×1920 at 72 dpi
          useCORS: true,
          allowTaint: true,
          width: 1080,
          height: 1920,
          backgroundColor: '#e8e8e8',
          logging: false,
        })

        if (i > 0) pdf.addPage([1080, 1920], 'portrait')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.72), 'JPEG', 0, 0, 1080, 1920)
      }

      document.body.removeChild(container)
      const filename = `encarte-${(campaign.title || 'casa-freitas').replace(/\s+/g,'-').toLowerCase()}.pdf`
      pdf.save(filename)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Erro ao gerar PDF:\n${msg}`)
      console.error(err)
    } finally {
      setLoading(false)
      setProgress('')
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
          <span className="text-sm">{progress}</span>
        </>
      ) : (
        <>
          📄 Exportar PDF
          {pages.length > 0 && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {pages.length + (campaign.coverImageBase64 ? 1 : 0)} pág.
            </span>
          )}
        </>
      )}
    </button>
  )
}
