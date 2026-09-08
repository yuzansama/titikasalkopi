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
 *
 * 4. `doPost` MENULIS ke sheet, dan ia terbuka untuk siapa pun. Tiga hal yang
 *    menahan penyalahgunaan, dan ketiganya wajib tetap ada:
 *    - Kuota harian baris otomatis (DAILY_WEB_ROW_CAP).
 *    - Teks dari luar dinetralkan sebelum ditulis, karena sel yang diawali
 *      `=`, `+`, `-`, atau `@` dieksekusi Sheets sebagai rumus. Tanpa ini,
 *      orang bisa menanam rumus yang berjalan saat owner membuka bukunya.
 *    - Kode yang sudah ada TIDAK PERNAH ditimpa. Baris yang sudah Anda sunting
 *      tidak bisa dikembalikan ke status awal oleh siapa pun dari luar.
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

/**
 * Kolom penanda asal baris: 'web' untuk yang dicatat otomatis saat pembeli
 * menekan tombol pesan, kosong untuk yang Anda ketik sendiri. Sengaja TIDAK
 * masuk daftar putih — ini pembukuan internal, bukan urusan pembeli.
 */
var SOURCE_COLUMN = 'sumber';
var WEB_SOURCE = 'web';

/** Status awal setiap baris otomatis. Harus ada di kosakata situs. */
var INITIAL_STATUS = 'menunggu-konfirmasi';

/**
 * Batas baris otomatis per hari.
 *
 * Bukan angka keamanan yang presisi, melainkan pagar kerusakan: endpoint ini
 * terbuka, dan tanpa batas satu orang bisa mengubur buku order Anda dalam
 * ribuan baris palsu. Volume nyata puluhan per BULAN, jadi 50 per hari sangat
 * longgar untuk pemakaian jujur dan tetap membatasi kerugian.
 */
var DAILY_WEB_ROW_CAP = 50;

/** Batas panjang ringkasan, disamakan dengan MAX_RECORD_ITEMS_LENGTH di situs. */
var MAX_ITEMS_LENGTH = 200;

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
  // Baris judul saja, tanpa data, tetap harus mengembalikan judulnya. Versi
  // pertama berhenti di sini dengan headers kosong, sehingga buku order yang
  // masih kosong MENOLAK pesanan pertamanya: doPost membaca kolom `kode` dan
  // `sumber` sebagai tidak ada, lalu gagal tertutup. Ditemukan oleh
  // scripts/check-order-tracker-gs.mjs, bukan oleh pembeli.
  if (values.length === 0) return { headers: [], rows: [] };

  var headers = values[0].map(function (h) {
    return String(h || '').trim().toLowerCase();
  });
  return { headers: headers, rows: values.length > 1 ? values.slice(1) : [] };
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

/* ================================================================== */
/* Menulis: pencatatan otomatis saat pembeli menekan tombol pesan      */
/* ================================================================== */

/**
 * Menetralkan teks dari luar sebelum masuk sel.
 *
 * Lapis yang MENGIKAT. Situs juga menetralkan, tetapi itu berjalan di peramban
 * dan bisa dilewati siapa pun yang memanggil endpoint ini langsung.
 */
function sanitizeCell_(raw) {
  return String(raw == null ? '' : raw)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[=+\-@]+/, '')
    .slice(0, MAX_ITEMS_LENGTH);
}

function today_() {
  return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
}

function doPost(e) {
  // Dua permintaan yang datang bersamaan bisa sama-sama membaca sheet lalu
  // sama-sama menambah baris. Kunci ini yang membuat pemeriksaan "kode sudah
  // ada" dan kuota harian benar-benar berarti.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return json({ ok: false });
  }

  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var code = normalizeCode(payload.code);
    if (!code) return json({ ok: false });

    var last4 = String(payload.last4 || '').replace(/\D/g, '');
    if (last4.length !== 4) last4 = '';

    var table = readTable_();
    // Gagal TERTUTUP. Tanpa kolom `sumber`, kuota harian tidak punya apa pun
    // untuk dihitung dan pagar itu mati diam-diam — lebih baik menolak mencatat
    // daripada membuka endpoint tulis tanpa batas.
    if (
      table.headers.indexOf(CODE_COLUMN) === -1 ||
      table.headers.indexOf(SOURCE_COLUMN) === -1
    ) {
      console.error('Kolom "' + CODE_COLUMN + '" atau "' + SOURCE_COLUMN + '" tidak ada.');
      return json({ ok: false });
    }

    var stamp = today_();
    var webRowsToday = 0;

    for (var i = 0; i < table.rows.length; i += 1) {
      var row = table.rows[i];
      // Kode yang sudah ada tidak pernah ditimpa. Ini yang membuat pengiriman
      // ganda tidak berbahaya, sekaligus melindungi baris yang sudah Anda
      // sunting sendiri.
      if (cell_(table.headers, row, CODE_COLUMN).toUpperCase() === code) {
        return json({ ok: true, duplicate: true });
      }
      if (
        cell_(table.headers, row, SOURCE_COLUMN) === WEB_SOURCE &&
        cell_(table.headers, row, 'tanggal_pesan') === stamp
      ) {
        webRowsToday += 1;
      }
    }

    if (webRowsToday >= DAILY_WEB_ROW_CAP) {
      console.warn('Kuota baris otomatis harian tercapai: ' + webRowsToday);
      return json({ ok: false, capped: true });
    }

    var values = {};
    values[CODE_COLUMN] = code;
    values[LAST4_COLUMN] = last4;
    values['status'] = INITIAL_STATUS;
    values['tanggal_pesan'] = stamp;
    values['tanggal_status'] = stamp;
    values['ringkasan'] = sanitizeCell_(payload.items);
    values[SOURCE_COLUMN] = WEB_SOURCE;

    // Dirakit mengikuti urutan kolom yang benar-benar ada di sheet, sehingga
    // memindah atau menambah kolom tidak merusak apa pun.
    var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    sheet.appendRow(
      table.headers.map(function (header) {
        return Object.prototype.hasOwnProperty.call(values, header)
          ? values[header]
          : '';
      }),
    );

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Uji mandiri. Jalankan dari editor Apps Script (pilih fungsi ini, tekan Run)
 * lalu baca Execution log. Gagal berarti bentuk sheet-nya belum benar.
 */
function selfCheck() {
  var table = readTable_();
  var required = [
    CODE_COLUMN,
    LAST4_COLUMN,
    'status',
    'tanggal_pesan',
    // Tanpa kolom ini, doPost tidak bisa membedakan baris otomatis dari baris
    // yang Anda ketik sendiri, sehingga kuota hariannya tidak berarti apa-apa.
    SOURCE_COLUMN,
  ];
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

  // Status awal yang ditulis doPost harus dikenali situs, atau setiap pesanan
  // otomatis akan tayang sebagai "status belum kami kenali".
  var KNOWN_STATUSES = [
    'menunggu-konfirmasi',
    'menunggu-pembayaran',
    'diproses',
    'dikirim',
    'selesai',
    'batal',
  ];
  if (KNOWN_STATUSES.indexOf(INITIAL_STATUS) === -1) {
    throw new Error('INITIAL_STATUS "' + INITIAL_STATUS + '" di luar kosakata situs.');
  }

  // Netralisasi rumus wajib bekerja; ini yang melindungi Anda saat membuka
  // buku order sendiri.
  if (sanitizeCell_('=HYPERLINK("http://x","klik")').charAt(0) === '=') {
    throw new Error('sanitizeCell_ tidak menetralkan rumus.');
  }

  console.log(
    'OK. ' + table.rows.length + ' baris, kolom: ' + table.headers.join(', '),
  );
}
