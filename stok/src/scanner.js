/**
 * Pemindai QR dari kamera belakang.
 *
 * Memakai BarcodeDetector bawaan browser bila ada (Chrome Android), dan jsQR
 * sebagai cadangan (Safari iOS). jsQR dimuat hanya bila dibutuhkan.
 *
 * Satu kode yang tetap berada di depan kamera dihitung SEKALI. Kode yang sama
 * baru dihitung lagi setelah hilang dari kamera minimal JEDA_MS, supaya satu
 * bungkus yang dipegang lama tidak tercatat berkali-kali.
 */

const JEDA_MS = 700;
const INTERVAL_MS = 120;

export async function mulaiScanner(video, onText) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Browser ini tidak bisa membuka kamera. Pakai Catat manual.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  video.setAttribute("playsinline", "");
  video.muted = true;
  await video.play();

  let detector = null;
  if ("BarcodeDetector" in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      detector = null;
    }
  }
  let jsQR = null;
  if (!detector) jsQR = (await import("jsqr")).default;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let berhenti = false;
  let terakhir = null;
  let terakhirTerlihat = 0;

  async function baca() {
    if (detector) {
      const hasil = await detector.detect(video).catch(() => []);
      return hasil[0]?.rawValue ?? null;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const skala = Math.min(1, 640 / Math.max(w, h));
    canvas.width = Math.round(w * skala);
    canvas.height = Math.round(h * skala);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  }

  async function putar() {
    if (berhenti) return;
    if (video.readyState >= 2) {
      const text = await baca();
      const now = Date.now();
      if (text) {
        if (text !== terakhir || now - terakhirTerlihat > JEDA_MS) {
          terakhir = text;
          onText(text);
        }
        terakhirTerlihat = now;
      }
    }
    setTimeout(putar, INTERVAL_MS);
  }
  putar();

  return function hentikan() {
    berhenti = true;
    for (const t of stream.getTracks()) t.stop();
    video.srcObject = null;
  };
}

/** Getar singkat sebagai tanda scan berhasil, bila perangkat mendukung. */
export function getar() {
  try {
    navigator.vibrate?.(60);
  } catch {
    /* tidak didukung */
  }
}
