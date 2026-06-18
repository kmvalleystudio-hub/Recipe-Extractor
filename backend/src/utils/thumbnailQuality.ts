import sharp from 'sharp';

export interface ThumbnailQualityScore {
  width: number;
  height: number;
  pixels: number;
  /** Laplacian variance — higher = sharper */
  sharpness: number;
  /** 0–1 composite quality for ranking */
  quality: number;
  acceptable: boolean;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 225;
const MIN_PIXELS = 90_000;
/** Below this Laplacian variance we treat the image as too soft/blurry */
const MIN_SHARPNESS = 45;

function laplacianVariance(grey: Uint8Array, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - width] - grey[i + width];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function computeQualityMetrics(width: number, height: number, sharpness: number): number {
  const pixelScore = Math.min(1, (width * height) / (1280 * 720));
  const sharpScore = Math.min(1, sharpness / 400);
  return pixelScore * 0.45 + sharpScore * 0.55;
}

export async function scoreThumbnailFromBuffer(buffer: Buffer): Promise<ThumbnailQualityScore | null> {
  try {
    const { data, info } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;
    if (width < 2 || height < 2) return null;

    const sharpness = laplacianVariance(new Uint8Array(data), width, height);
    const pixels = width * height;
    const quality = computeQualityMetrics(width, height, sharpness);
    const acceptable =
      width >= MIN_WIDTH &&
      height >= MIN_HEIGHT &&
      pixels >= MIN_PIXELS &&
      sharpness >= MIN_SHARPNESS;

    return { width, height, pixels, sharpness, quality, acceptable };
  } catch {
    return null;
  }
}

export { MIN_SHARPNESS, MIN_WIDTH, MIN_HEIGHT, MIN_PIXELS };
