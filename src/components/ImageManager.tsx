'use client'
import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Product } from '@/types/catalog'
import { useCatalogStore } from '@/store/catalog'

interface Props {
  product: Product
  onClose: () => void
}

export default function ImageManager({ product, onClose }: Props) {
  const { updateProductImage } = useCatalogStore()
  const [driveIdx, setDriveIdx] = useState(0)
  const [src, setSrc] = useState<string>(
    product.customImageBase64 ||
      (product.imageFileId ? `/api/drive/${product.imageFileId}` : '')
  )
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>()
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const getCroppedImage = useCallback(async (): Promise<string | null> => {
    if (!imgRef.current || !completedCrop) return src || null
    const canvas = document.createElement('canvas')
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Fill white before drawing — prevents transparent PNG pixels from
    // rendering as black when converting to JPEG (which has no alpha channel)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [completedCrop, src])

  const handleSave = async () => {
    const result = await getCroppedImage()
    if (result) {
      updateProductImage(product.id, result)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Gestor de Imagem</h3>
            <p className="text-sm text-gray-500">
              {product.code} — {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#312783] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#312783]/90"
            >
              Upload Manual
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {product.imageFileIds && product.imageFileIds.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Fotos disponíveis no Drive ({product.imageFileIds.length})</p>
              <div className="flex gap-2 flex-wrap">
                {product.imageFileIds.map((fid, idx) => (
                  <button
                    key={fid}
                    onClick={() => {
                      setDriveIdx(idx)
                      setSrc(`/api/drive/${fid}`)
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      driveIdx === idx ? 'border-[#312783]' : 'border-gray-200'
                    }`}
                  >
                    <img src={`/api/drive/${fid}`} alt={`Foto ${idx+1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {src ? (
            <div className="border rounded-xl overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
              >
                <img
                  ref={imgRef}
                  src={src}
                  alt="Preview"
                  className="max-w-full"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </ReactCrop>
              <p className="text-xs text-gray-400 p-2 text-center">
                Arrasta para definir o recorte · Proporção 1:1
              </p>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#312783] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-500 text-sm">Clica para fazer upload de uma imagem</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-[#312783] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#312783]/90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
