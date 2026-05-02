export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation: number = 0,
  quality: number = 0.92,
  mimeType: string = "image/jpeg"
): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  if (rotation !== 0) {
    const rotRad = (rotation * Math.PI) / 180;
    const safeArea = Math.max(image.width, image.height) * 2;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("Temp canvas context unavailable");
    tempCanvas.width = safeArea;
    tempCanvas.height = safeArea;
    tempCtx.translate(safeArea / 2, safeArea / 2);
    tempCtx.rotate(rotRad);
    tempCtx.translate(-image.width / 2, -image.height / 2);
    tempCtx.drawImage(image, 0, 0);
    const data = tempCtx.getImageData(0, 0, safeArea, safeArea);
    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
    );
  } else {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      mimeType,
      quality
    );
  });
}
