export function optimizeImageUrl(url, opts = {}) {
  if (!url || typeof url !== 'string') return url;
  const { w, h, fit = 'fill', q = 'auto' } = opts;

  // Only transform Cloudinary URLs with /upload/
  try {
    const hasCloudinary = url.includes('res.cloudinary.com');
    const uploadIdx = url.indexOf('/upload/');
    if (!hasCloudinary || uploadIdx === -1) return url;

    const before = url.slice(0, uploadIdx + 8); // include '/upload/'
    const after = url.slice(uploadIdx + 8);

    const parts = [];
    parts.push('f_auto');
    parts.push(`q_${q}`);
    if (w) parts.push(`w_${w}`);
    if (h) parts.push(`h_${h}`);
    if (fit) parts.push(`c_${fit}`);

    const transform = parts.join(',');
    return `${before}${transform}/${after}`;
  } catch {
    return url;
  }
}
