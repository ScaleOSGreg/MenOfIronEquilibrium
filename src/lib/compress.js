import imageCompression from "browser-image-compression";

// Strip EXIF (incl. GPS), resize to a reasonable max edge, recompress to JPEG.
// Returns a File suitable for direct upload to Supabase Storage.
export async function compressForUpload(file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.82,
    exifOrientation: 1,
  });
  // imageCompression already drops EXIF on re-encode; force a clean name.
  return new File([compressed], `${crypto.randomUUID()}.jpg`, { type: "image/jpeg" });
}
