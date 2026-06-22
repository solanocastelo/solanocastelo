const THRESHOLD = 240 // pixels acima deste valor em R,G,B são considerados "brancos"
const PADDING = 4    // px de margem a deixar à volta do conteúdo

export async function trimWhiteBorders(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      let data: ImageData
      try {
        data = ctx.getImageData(0, 0, w, h)
      } catch {
        resolve(src) // canvas contaminado (CORS) — devolve original
        return
      }

      const px = data.data
      let top = h, left = w, right = 0, bottom = 0

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3]
          // ignora pixels transparentes ou brancos
          if (a < 20 || (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD)) continue
          if (y < top) top = y
          if (y > bottom) bottom = y
          if (x < left) left = x
          if (x > right) right = x
        }
      }

      // sem conteúdo detectado — devolve original
      if (top > bottom || left > right) { resolve(src); return }

      top    = Math.max(0, top - PADDING)
      left   = Math.max(0, left - PADDING)
      bottom = Math.min(h - 1, bottom + PADDING)
      right  = Math.min(w - 1, right + PADDING)

      const cw = right - left + 1
      const ch = bottom - top + 1

      const out = document.createElement('canvas')
      out.width = cw
      out.height = ch
      const octx = out.getContext('2d')!
      octx.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch)
      resolve(out.toDataURL('image/png'))
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}
