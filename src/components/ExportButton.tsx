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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const BOX_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#1c3f86" stroke-width="2" stroke-linejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>'

// Loads an image and re-encodes it as a JPEG with a solid white background.
// JPEG has no alpha channel, so transparent PNG pixels are composited onto
// white here — guaranteeing a 100% white background in the exported PDF
// regardless of server-side image processing.
async function toWhiteJpeg(url: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 600
        canvas.height = img.naturalHeight || 600
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(url); return }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      } catch {
        resolve(url) // tainted canvas or other failure — fall back to original
      }
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
}

const DOC_CSS = `
  :root{
    --primary:#312783;
    --footer-bg:#002d96;
    --page-bg:#003dac;
    --card-bg:#ffffff;
    --discount:#1faa4d;
    --pill-bg:#e7effb;
    --pill-fg:#1c3f86;
    --ink:#1f1f1f;
    --muted:#8a8a8a;
    --line:#ececec;
    --font:Arial, Helvetica, sans-serif;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;}
  body{font-family:var(--font); background:#fff; color:var(--ink);}

  .pages{display:flex; flex-direction:column; align-items:center;}
  .page{
    width:1080px; height:1920px;
    background:var(--page-bg);
    display:flex; flex-direction:column;
    overflow:hidden;
  }
  .cover-page{background:var(--primary); position:relative;}

  .page-header{
    flex:none; height:130px; padding:0 36px;
    display:flex; align-items:center; justify-content:space-between;
    background:var(--primary); color:#fff;
  }
  .page-header .brand{display:flex; align-items:center; gap:20px;}
  .page-header .brand .logo{height:78px; width:auto;}
  .page-header .sep{width:1px; height:44px; background:rgba(255,255,255,.35);}
  .page-header .sub{font-size:24px; font-weight:500; opacity:.9;}
  .page-header .pg{font-size:27px; font-weight:700; background:rgba(255,255,255,.14); padding:12px 27px; border-radius:999px;}

  .grid{
    flex:1 1 auto; display:grid; grid-template-columns:repeat(2,1fr);
    grid-auto-rows:auto; align-items:start; align-content:space-evenly;
    gap:30px; padding:34px; min-height:0;
  }

  .card{
    background:var(--card-bg); border-radius:14px;
    overflow:hidden; display:flex; flex-direction:column;
  }

  .photo{
    position:relative; background:#fafafa;
    display:flex; align-items:center; justify-content:center;
    width:100%; aspect-ratio:1 / 1;
  }
  .photo .frame{
    width:100%; height:100%; aspect-ratio:1 / 1; border-radius:8px;
    background-color:#ffffff;
    background-image:repeating-linear-gradient(45deg,#ececec 0 12px,#f7f7f7 12px 24px);
    display:flex; align-items:center; justify-content:center; overflow:hidden;
  }
  .photo .frame .ph{font-family:'SF Mono',Menlo,Consolas,monospace; font-size:20px; color:#a4a4a4; letter-spacing:.06em; text-transform:uppercase;}
  .photo img{width:100%; height:100%; object-fit:contain; background:#ffffff;}

  .badge{
    position:absolute; top:16px; left:16px;
    background:var(--discount); color:#fff;
    font-size:24px; font-weight:900; padding:13px 22px; border-radius:10px;
    letter-spacing:.02em;
  }

  .info{border-top:1px solid var(--line); display:flex; flex-direction:column; padding:20px 22px 22px; gap:16px;}
  .name{
    font-weight:700; line-height:1.3; color:var(--ink); font-size:26px; min-height:67px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    word-break:break-word; overflow-wrap:break-word;
  }
  .price{display:flex; flex-direction:column; gap:2px;}
  .price .was{color:#9a9a9a; text-decoration:line-through; font-size:20px;}
  .price .now{display:flex; align-items:baseline; color:#161616; line-height:1;}
  .price .now .cur{font-weight:700; margin-right:5px; font-size:30px;}
  .price .now .int{font-weight:900; letter-spacing:-2px; font-size:72px;}
  .price .now .dec{font-weight:700; font-size:33px;}

  .pill{
    align-self:flex-start; width:fit-content; max-width:100%;
    display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
    background:var(--pill-bg); color:var(--pill-fg); font-weight:700; border-radius:999px;
    font-size:21px; padding:10px 22px;
  }
  .pill svg{width:22px; height:22px; flex:none;}

  .meta{display:flex; align-items:center; gap:18px; border-top:1px solid #eee; padding-top:14px; font-size:18px; color:var(--muted);}
  .meta b{color:#444; font-weight:700;}

  .page-footer{
    flex:none; height:170px; padding:0 40px;
    display:flex; align-items:center; justify-content:space-between; gap:24px;
    background:var(--footer-bg); color:#fff;
  }
  .page-footer .col{display:flex; flex-direction:column; gap:6px;}
  .page-footer .lbl{font-size:16px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6);}
  .page-footer .val{font-size:27px; font-weight:700;}
  .page-footer .vsep{width:1px; height:64px; background:rgba(255,255,255,.25);}

  @page{ size:1080px 1920px; margin:0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @media print{
    html,body{background:#fff;}
    .pages{padding:0;}
    .page{ page-break-after:always; break-after:page; }
    .page:last-child{page-break-after:auto; break-after:auto;}
  }
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
      // The print iframe is same-origin, so Drive images can be loaded
      // directly via the proxy URL — no need to inline base64 (which would
      // create a huge document and crash the browser on large catalogs).
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
        ${i ? '<div class="vsep"></div>' : ''}
        <div class="col"><div class="lbl">${escapeHtml(l)}</div><div class="val">${escapeHtml(v)}</div></div>
      `).join('')

      const totalPages = pages.length + (campaign.coverImageBase64 ? 1 : 0)
      const pageHtmls: string[] = []

      // Cover page
      if (campaign.coverImageBase64) {
        const now = new Date()
        const stamp = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        pageHtmls.push(`
          <div class="page cover-page">
            <img src="${campaign.coverImageBase64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(13,31,51,0.9),transparent);padding:60px 50px 50px;">
              <h1 style="color:#fff;font-size:52px;font-weight:700;line-height:1.2;margin:0;">${escapeHtml(campaign.title)}</h1>
              <p style="color:rgba(255,255,255,0.6);font-size:26px;margin:12px 0 0;">${escapeHtml(campaign.plaza)}</p>
            </div>
            <div style="position:absolute;bottom:20px;right:28px;z-index:10;text-align:right;">
              <div style="font-size:11px;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px;">Gerado em</div>
              <div style="font-size:13px;color:rgba(255,255,255,.7);font-weight:600;">${stamp}</div>
            </div>
          </div>`)
      }

      // Pre-convert every product image to a white-background JPEG so
      // transparent PNGs never render with a black background in the PDF.
      const allProducts = pages.flatMap(pg => pg.products)
      const imageMap = new Map<string, string>()
      const toConvert = allProducts
        .filter(p => !p.customImageBase64 && p.imageFileId)
        .map(p => p.imageFileId as string)
      const uniqueIds = Array.from(new Set(toConvert))
      let converted = 0
      await Promise.all(
        uniqueIds.map(async id => {
          const jpeg = await toWhiteJpeg(`/api/drive/${id}?w=600&q=72`)
          imageMap.set(id, jpeg)
          converted++
          setProgress(Math.round((converted / uniqueIds.length) * 100))
        })
      )

      // Product pages — 4 per page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const cards = Array.from({ length: 4 }).map((_, j) => {
          const p = page.products[j]
          if (!p) return `<div class="card" style="background:#f9f9f9;box-shadow:none;"></div>`

          const imgSrc = p.customImageBase64
            ? p.customImageBase64
            : p.imageFileId ? (imageMap.get(p.imageFileId) || `/api/drive/${p.imageFileId}?w=600&q=72`) : null
          const imgHtml = imgSrc
            ? `<img src="${imgSrc}" alt="" loading="eager" />`
            : `<span class="ph">Foto do produto</span>`

          const priceMatch = p.priceFormatted.match(/^R?\$?\s*([\d.]+)[,.](\d{2})$/)
          const int = priceMatch ? priceMatch[1] : p.priceFormatted.replace('R$', '').trim()
          const dec = priceMatch ? priceMatch[2] : '00'

          const pill = p.caixaMaster
            ? `<div class="pill">${BOX_ICON} Caixa Master ${escapeHtml(p.caixaMaster)} peças</div>`
            : ''

          return `
            <div class="card">
              <div class="photo">
                <div class="frame">${imgHtml}</div>
                ${p.discountPercent > 0 ? `<div class="badge">${p.discountPercent}% OFF</div>` : ''}
              </div>
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
        pageHtmls.push(`
          <div class="page">
            <header class="page-header">
              <div class="brand"><svg class="logo" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-12,110,60)"><rect x="18" y="22" width="184" height="96" rx="16" ry="16" fill="#ffe600" stroke="#e8000d" stroke-width="8"/><circle cx="110" cy="14" r="9" fill="none" stroke="#d0d0d0" stroke-width="4"/><line x1="110" y1="23" x2="110" y2="30" stroke="#d0d0d0" stroke-width="4"/><text x="110" y="90" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="68" font-weight="900" fill="#e8000d" letter-spacing="-2">CF</text></g></svg><span class="sep"></span><span class="sub">Encarte de Ofertas B2B</span></div>
              <div class="pg">Pg. ${pageNum} / ${totalPages}</div>
            </header>
            <div class="grid">${cards}</div>
            <footer class="page-footer">${footerHtml}</footer>
          </div>`)
      }

      const docHtml = `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(campaign.title || 'Encarte Casa Freitas')}</title>
          <style>${DOC_CSS}</style>
        </head>
        <body>
          <div class="pages">${pageHtmls.join('')}</div>
        </body>
        </html>`

      // Render into a hidden iframe and trigger the browser's native print dialog
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
      document.body.appendChild(iframe)

      const idoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!idoc) throw new Error('Não foi possível criar o documento de impressão.')
      idoc.open()
      idoc.write(docHtml)
      idoc.close()

      // Wait for all images inside the iframe to load (via the same-origin proxy)
      await new Promise<void>(resolve => {
        const imgs = Array.from(idoc.images || [])
        const total = imgs.length
        if (total === 0) { setProgress(100); resolve(); return }
        let loaded = 0
        let settled = false
        const finish = () => { if (!settled) { settled = true; resolve() } }
        const check = () => {
          loaded++
          setProgress(Math.round((loaded / total) * 100))
          if (loaded >= total) finish()
        }
        imgs.forEach(img => {
          if (img.complete) check()
          else { img.onload = check; img.onerror = check }
        })
        // Safety timeout — proceed to print even if some images are slow (30s)
        setTimeout(finish, 30000)
      })
      await new Promise(r => setTimeout(r, 200))

      const win = iframe.contentWindow
      if (win) {
        win.focus()
        win.print()
      }

      // Clean up after the print dialog closes
      const cleanup = () => {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
        }, 500)
      }
      if (win) {
        win.onafterprint = cleanup
        // Fallback in case onafterprint never fires
        setTimeout(cleanup, 60000)
      } else {
        cleanup()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Erro ao gerar PDF:\n${msg}`)
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
          {progress > 0 ? `A carregar imagens... ${progress}%` : 'A preparar...'}
        </>
      ) : (
        <>
          🖨️ Imprimir / PDF
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
