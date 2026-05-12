export function compressImage(
  source: File | Blob,
  maxPx = 600,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, maxPx / Math.max(w, h))
      const tw = Math.round(w * scale)
      const th = Math.round(h * scale)

      const canvas = document.createElement("canvas")
      canvas.width = tw
      canvas.height = th

      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas context unavailable"))

      // imageSmoothingQuality = high evita pixelación al reducir
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, tw, th)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image failed to load"))
    }

    img.src = url
  })
}
