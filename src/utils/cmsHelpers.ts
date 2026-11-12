export function extractYouTubeVideoId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  
  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for various YouTube URL forms
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );

  if (match && match[1]) {
    return match[1];
  }

  return trimmed;
}

export function isVideoSource(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('data:video/') ||
    clean.endsWith('.webm') ||
    clean.includes('.webm?') ||
    clean.includes('.webm#') ||
    clean.endsWith('.mp4') ||
    clean.includes('.mp4?') ||
    clean.includes('.mp4#') ||
    clean.endsWith('.mov') ||
    clean.includes('.mov?')
  );
}

export function compressAndReadFileAsDataUrl(
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.75
): Promise<string> {
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  const isWebm = fileType.includes('webm') || fileName.endsWith('.webm') || fileType.startsWith('video/');
  const isGif = fileType === 'image/gif' || fileName.endsWith('.gif');
  const isSvg = fileType.includes('svg') || fileName.endsWith('.svg');

  // Video / WEBM format
  if (isWebm) {
    if (file.size > 850 * 1024) {
      alert(`⚠️ WEBM ဖိုင်အရွယ်အစားသည် ${(file.size / 1024).toFixed(0)}KB ဖြစ်နေပါသည်။ Firestore ကန့်သတ်ချက် (1MB) ကြောင့် 750KB အောက် ဖိုင်ငယ်လေးများ သို့မဟုတ် Online Video Link (URL) ကိုသာ အသုံးပြုပေးပါရန် အကြံပြုအပ်ပါသည်။`);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // GIF animated images: keep raw frames so animation is preserved
  if (isGif) {
    if (file.size > 850 * 1024) {
      alert(`⚠️ GIF ဖိုင်အရွယ်အစား ${(file.size / 1024).toFixed(0)}KB ဖြစ်နေပါသည်။ ဝက်ဘ်ဆိုက် ချောမွေ့မြန်ဆန်စေရန် 800KB အောက် GIF သို့မဟုတ် Giphy/Tenor တိုက်ရိုက် Link (URL) သုံးရန် အကြံပြုပါသည်။`);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // SVG vectors & stickers: keep raw text/xml
  if (isSvg) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Standard raster images (JPEG, PNG, WebP)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Preserve sticker transparency with image/webp if original has alpha
        const isTransparentType = fileType === 'image/png' || fileType === 'image/webp' || fileName.endsWith('.png') || fileName.endsWith('.webp');
        const exportMime = isTransparentType ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(exportMime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Re-compresses an existing Base64 data URL to keep Firestore documents lightweight.
 * Safely preserves video/webm, animated gif, and svg stickers without corrupting them.
 */
export function compressDataUrl(
  dataUrl: string,
  maxDim = 500,
  quality = 0.75
): Promise<string> {
  if (!dataUrl) {
    return Promise.resolve(dataUrl);
  }

  // Don't recompress video/webm, animated gif, or svg
  if (
    !dataUrl.startsWith('data:image/') ||
    dataUrl.startsWith('data:image/gif') ||
    dataUrl.startsWith('data:image/svg') ||
    dataUrl.startsWith('data:video/')
  ) {
    return Promise.resolve(dataUrl);
  }

  // If already tiny (< 35 KB), no need to re-compress
  if (dataUrl.length < 35000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const isTransparentType = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp');
      const exportMime = isTransparentType ? 'image/webp' : 'image/jpeg';
      const compressed = canvas.toDataURL(exportMime, quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

