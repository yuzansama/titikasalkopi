/**
 * Buku order Titik Asal Kopi — endpoint baca-saja untuk /lacak (FR-51).
 *
 * Tempelkan seluruh berkas ini ke Apps Script milik Google Sheet buku order,
 * lalu Deploy > New deployment > Web app. Petunjuk lengkap beserta bentuk
 * sheet-nya ada di docs/08-lacak-pesanan.md.
 *
 * ATURAN YANG TIDAK BOLEH DILANGGAR
 *
 * 1. Balasan memakai DAFTAR PUTIH kolom (PUBLIC_FIELDS). Kolom apa pun yang
 *    Anda tambahkan ke sheet — nama pembeli, nomor WhatsApp, alamat, catatan
 *    internal, margin — TIDAK akan ikut terkirim kecuali Anda sendiri yang
 *    menambahkannya ke daftar itu. Daftar putih dipilih, bukan daftar hitam,
 *    supaya kolom baru aman secara bawaan.
 *
 * 2. Kode salah dan last4 salah menghasilkan jawaban yang PERSIS SAMA
 *    ({found:false}). Membedakan keduanya mengubah endpoint ini menjadi alat
 *    untuk menebak: penyerang bisa memastikan sebuah kode order valid lalu
 *    mencoba 10.000 kemungkinan empat digit.
 *
 * 3. Web app dideploy dengan "Execute as: Me" dan "Who has access: Anyone".
 *    Sheet-nya sendiri TETAP privat — hanya skrip ini yang membacanya, dan ia
 *    hanya mengembalikan kolom pada daftar putih.
 */

/** Nama tab pada spreadsheet. */
var SHEET_NAME = 'pesanan';

/**
 * Kolom yang boleh keluar, dipetakan ke nama medan JSON yang dibaca situs.
 * Kunci = judul kolom di baris pertama sheet (huruf kecil, tanpa spasi ujung).
 *
 * JANGAN menambahkan kolom yang memuat data pribadi pembeli ke sini.
 */
var PUBLIC_FIELDS = {
  kode: 'code',
  status: 'status',
  tanggal_status: 'statusUpdatedAt',
  tanggal_pesan: 'orderedAt',
  kurir: 'courier',
  resi: 'trackingNumber',
  ringkasan: 'items',
};

/** Kolom yang dipakai untuk mencocokkan, tetapi TIDAK pernah dikirim keluar. */
var CODE_COLUMN = 'kode';
var LAST4_COLUMN = 'last4';

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var code = normalizeCode(params.code);
    var last4 = String(params.last4 || '').trim();

    if (!code || !/^\d{4}$/.test(last4)) {
      return json({ found: false });
    }

    var row = findOrder_(code, last4);
    return json(row ? buildPublicPayload_(row) : { found: false });
  } catch (err) {
    // Jangan pernah membocorkan jejak galat ke publik. Catat di log eksekusi
    // Apps Script, balas dengan bentuk yang sama seperti tidak ketemu.
    console.error(err);
    return json({ found: false });
  }
}

/**
 * Menyamakan bentuk kode dengan yang dinormalisasi situs: huruf besar, tanpa
 * spasi, berawalan TAK-. Owner yang mengetik "tak-260908-k7q2" di sheet tetap
 * cocok.
 */
function normalizeCode(raw) {
  var value = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!value) return '';
  if (value.indexOf('TAK-') !== 0) value = 'TAK-' + value;
  return /^TAK-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(value)
    ? value
    : '';
}

function readTable_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Tab "' + SHEET_NAME + '" tidak ada.');

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { headers: [], rows: [] };

  var headers = values[0].map(function (h) {
    return String(h || '').trim().toLowerCase();
  });
  return { headers: headers, rows: values.slice(1) };
}

function cell_(headers, row, columnName) {
  var index = headers.indexOf(columnName);
  if (index === -1) return '';
  var value = row[index];
  // Google mengubah kolom tanggal menjadi objek Date. Situs mengharapkan
  // YYYY-MM-DD, dan zona waktunya WIB supaya tanggal tidak mundur sehari.
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return String(value == null ? '' : value).trim();
}

function findOrder_(code, last4) {
  var table = readTable_();
  for (var i = 0; i < table.rows.length; i += 1) {
    var row = table.rows[i];
    if (cell_(table.headers, row, CODE_COLUMN).trim().toUpperCase() !== code) {
      continue;
    }
    // Kolom last4 kadang terbaca sebagai angka dan kehilangan nol di depan.
    var stored = cell_(table.headers, row, LAST4_COLUMN).replace(/\D/g, '');
    if (stored.length && stored.length < 4) {
      stored = ('0000' + stored).slice(-4);
    }
    if (stored !== last4) return null;
    return { headers: table.headers, row: row };
  }
  return null;
}

function buildPublicPayload_(match) {
  var payload = { found: true };
  Object.keys(PUBLIC_FIELDS).forEach(function (column) {
    var value = cell_(match.headers, match.row, column);
    if (value) payload[PUBLIC_FIELDS[column]] = value;
  });
  return payload;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Uji mandiri. Jalankan dari editor Apps Script (pilih fungsi ini, tekan Run)
 * lalu baca Execution log. Gagal berarti bentuk sheet-nya belum benar.
 */
function selfCheck() {
  var table = readTable_();
  var required = [CODE_COLUMN, LAST4_COLUMN, 'status'];
  required.forEach(function (column) {
    if (table.headers.indexOf(column) === -1) {
      throw new Error('Kolom wajib "' + column + '" tidak ada di baris judul.');
    }
  });

  // Daftar putih tidak boleh diam-diam memuat kolom yang tidak ada.
  Object.keys(PUBLIC_FIELDS).forEach(function (column) {
    if (table.headers.indexOf(column) === -1) {
      console.warn('Kolom "' + column + '" ada di daftar putih tapi tidak di sheet.');
    }
  });

  // Kode salah dan last4 salah wajib menghasilkan jawaban yang sama.
  var wrongCode = doGet({ parameter: { code: 'TAK-990101-ZZZZ', last4: '0000' } });
  var wrongLast4 = doGet({ parameter: { code: 'TAK-990101-ZZZZ', last4: '1111' } });
  if (wrongCode.getContent() !== wrongLast4.getContent()) {
    throw new Error('Jawaban kode salah dan last4 salah berbeda — itu oracle penebak.');
  }

  console.log(
    'OK. ' + table.rows.length + ' baris, kolom: ' + table.headers.join(', '),
  );
}
