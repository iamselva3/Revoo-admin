import { apiClient } from '../api/client';

export type ImageFolder = 'devices' | 'brands' | 'banners' | 'popups' | 'products' | 'categories' | 'misc';

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image.'));
    };
    img.src = url;
  });

/** Scales the photo down to `maxDim` and re-encodes it (JPEG stays JPEG; PNG/WebP keep transparency as WebP). */
const shrink = async (file: File, maxDim: number): Promise<Blob> => {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  // Keep the original if re-encoding didn't help (already small and within size)
  if (!blob || (scale === 1 && blob.size >= file.size && /^image\/(jpeg|png|webp)$/.test(file.type))) return file;
  return blob;
};

/**
 * Uploads a photo to the image store (Cloudflare R2 bucket) and returns its public URL,
 * e.g. https://images.genietn.in/uploads/devices/galaxy-s26-1a2b3c4d5e6f.webp
 */
export async function uploadImageFile(
  file: File,
  folder: ImageFolder,
  options: { name?: string; maxDim?: number } = {}
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPEG, PNG or WebP).');
  const blob = await shrink(file, options.maxDim ?? 1200);
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type.replace('image/', '') || 'jpg';

  const form = new FormData();
  form.append('folder', folder);
  if (options.name) form.append('name', options.name);
  form.append('image', blob, `photo.${ext}`);

  try {
    const res = await apiClient.post('/catalogue/admin/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data?.data?.url;
    if (!url) throw new Error('The server did not return the photo address.');
    return url;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || err?.message || 'Photo upload failed. Please try again.');
  }
}
