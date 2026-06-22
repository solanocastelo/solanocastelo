/**
 * URL da imagem de um arquivo do Drive.
 *
 * Em produção, aponta para o Cloudflare Worker (banda gratuita/ilimitada)
 * quando NEXT_PUBLIC_IMAGE_BASE está definido. Caso contrário, usa o proxy
 * interno /api/drive (útil no desenvolvimento local).
 */
export function driveImageUrl(fileId: string): string {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE
  if (base) return `${base.replace(/\/$/, '')}/${fileId}`
  return `/api/drive/${fileId}`
}
