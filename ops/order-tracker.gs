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
 *    mencoba 10.000 kemungkinan empat digit. Dua pagar lain menjaga hal yang
 *    sama dari arah berbeda:
 *    - doPost menjawab kode lama dan kode baru dengan bentuk yang sama, jadi
 *      ia tidak bisa dipakai untuk memastikan sebuah kode ada.
 *    - doGet membatasi percobaan per kode (MAX_FAILED_LOOKUPS). Sesudah batas
 *      itu, jawaban SELALU {found:false}, benar atau salah last4-nya.
 *    Audit keamanan 22 Nov 2026 (black-box) menandai penegakan last4 sebagai
 *    risiko utama; dua pagar di atas ditambahkan setelah membaca kodenya.
 *
 * 3. Web app dideploy dengan "Execute as: Me" dan "Who has access: Anyone".
 *    Sheet-nya sendiri TETAP privat — hanya skrip ini yang membacanya, dan ia
 *    hanya mengembalikan kolom pada daftar putih.
 *
 * 4. `doPost` MENULIS ke sheet, dan ia terbuka untuk siapa pun. Tiga hal yang
 *    menahan penyalahgunaan, dan ketiganya wajib tetap ada:
 *    - Kuota harian baris otomatis per sumber (DAILY_WEB_ROW_CAP,
 *      DAILY_TELEGRAM_ROW_CAP).
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
 * menekan tombol pesan di situs, 'telegram' untuk checkout di bot Telegram
 * (medan `source` di POST), kosong untuk yang Anda ketik sendiri. POST tanpa
 * `source`, atau dengan nilai lain, dicatat sebagai 'web'. Sengaja TIDAK
 * masuk daftar putih — ini pembukuan internal, bukan urusan pembeli.
 */
var SOURCE_COLUMN = 'sumber';
var WEB_SOURCE = 'web';
var TELEGRAM_SOURCE = 'telegram';

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

/**
 * Batas baris otomatis per hari dari bot Telegram, dihitung terpisah supaya
 * bot tidak menghabiskan jatah web dan sebaliknya. Bot sendiri membatasi 20
 * checkout sehari. Siapa pun bisa mengaku 'telegram', jadi pagar total
 * endpoint ini menjadi 50 + 20 baris sehari.
 */
var DAILY_TELEGRAM_ROW_CAP = 20;

/** Batas panjang ringkasan, disamakan dengan MAX_RECORD_ITEMS_LENGTH di situs. */
var MAX_ITEMS_LENGTH = 200;

/**
 * Pencarian gagal yang diizinkan per kode sebelum kode itu dikunci sementara.
 * 10 kali dalam 6 jam cukup untuk pembeli yang salah ketik, dan membuat
 * 10.000 kemungkinan last4 butuh lebih dari satu tahun untuk dicoba semua.
 * 6 jam adalah umur terlama yang diizinkan CacheService.
 */
var MAX_FAILED_LOOKUPS = 10;
var LOOKUP_LOCK_SECONDS = 6 * 60 * 60;

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};

    // Katalog (KD-08). Dipisahkan lebih dulu karena ia tidak memakai kode order
    // sama sekali. Isinya harga dan stok — yang memang sudah tayang di situs,
    // jadi tidak ada yang bocor dengan menyajikannya di sini.
    if (params.katalog === '1') return json(readCatalog_());

    var code = normalizeCode(params.code);
    var last4 = String(params.last4 || '').trim();

    if (!code || !/^\d{4}$/.test(last4)) {
      return json({ found: false });
    }

    // Dihitung per kode, termasuk kode yang tidak ada, supaya penguncian itu
    // sendiri tidak membedakan kode nyata dari kode karangan.
    var cache = CacheService.getScriptCache();
    var failKey = 'lacak-gagal:' + code;
    var failures = Number(cache.get(failKey) || 0);
    if (failures >= MAX_FAILED_LOOKUPS) return json({ found: false });

    var row = findOrder_(code, last4);
    if (!row) {
      cache.put(failKey, String(failures + 1), LOOKUP_LOCK_SECONDS);
      return json({ found: false });
    }
    return json(buildPublicPayload_(row));
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
/* Katalog: harga, stok, dan lini 100 gram (KD-08)                     */
/* ================================================================== */

var PRICE_SHEET = 'harga';
var STOCK_SHEET = 'stok';

/** Membaca satu tab sebagai array objek berkunci judul kolom. */
function readSheetRows_(name) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return [];

  var headers = values[0].map(function (h) {
    return String(h || '').trim().toLowerCase();
  });

  return values.slice(1).map(function (row) {
    var record = {};
    headers.forEach(function (header, i) {
      if (!header) return;
      var value = row[i];
      record[header] =
        Object.prototype.toString.call(value) === '[object Date]'
          ? Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd')
          : String(value == null ? '' : value).trim();
    });
    return record;
  });
}

/** Angka rupiah dari sel. Mengembalikan null bila bukan bilangan bulat positif. */
function money_(raw) {
  // Sel bisa terbaca "Rp125.000", "125.000", atau 125000. Ketiganya diterima;
  // yang tidak diterima adalah apa pun yang menyisakan karakter selain digit,
  // karena "125.0o0" harus gagal, bukan diam-diam menjadi 1250.
  var text = String(raw == null ? '' : raw).trim();
  if (!text) return null;
  var digits = text.replace(/^Rp\s*/i, '').replace(/[.\s]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  var value = Number(digits);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Seluruh katalog yang boleh diubah owner tanpa menyentuh kode.
 *
 * Tab yang tidak ada dikembalikan sebagai null, BUKAN sebagai objek kosong.
 * Perbedaannya menentukan: skrip sinkronisasi menolak menulis apa pun bila
 * sebuah tab hilang, sementara objek kosong akan terbaca sebagai "owner
 * menghapus semuanya" dan menerbitkan katalog kosong.
 */
function readCatalog_() {
  var priceRows = readSheetRows_(PRICE_SHEET);
  var stockRows = readSheetRows_(STOCK_SHEET);

  var harga = null;
  if (priceRows) {
    harga = {};
    priceRows.forEach(function (row) {
      var key = String(row.kunci || '').trim();
      var value = money_(row.harga);
      if (key && value !== null) harga[key] = value;
    });
  }

  var stok = null;
  if (stockRows) {
    stok = {};
    stockRows.forEach(function (row) {
      var slug = String(row.slug || '').trim().toLowerCase();
      var status = String(row.status || '').trim().toLowerCase();
      if (slug && (status === 'available' || status === 'out-of-stock')) {
        stok[slug] = status;
      }
    });
  }

  return { harga: harga, stok: stok };
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

    var source = payload.source === TELEGRAM_SOURCE ? TELEGRAM_SOURCE : WEB_SOURCE;
    var cap = source === TELEGRAM_SOURCE ? DAILY_TELEGRAM_ROW_CAP : DAILY_WEB_ROW_CAP;
    var stamp = today_();
    var rowsToday = 0;
    var exists = false;

    for (var i = 0; i < table.rows.length; i += 1) {
      var row = table.rows[i];
      if (cell_(table.headers, row, CODE_COLUMN).toUpperCase() === code) {
        exists = true;
      }
      if (
        cell_(table.headers, row, SOURCE_COLUMN) === source &&
        cell_(table.headers, row, 'tanggal_pesan') === stamp
      ) {
        rowsToday += 1;
      }
    }

    // Kuota diperiksa SEBELUM keberadaan kode, dan kode lama dijawab persis
    // seperti kode baru. Versi sebelumnya menjawab kode lama dengan
    // penanda "duplikat", bahkan sesudah kuota habis, sehingga siapa pun bisa
    // memastikan kode mana yang nyata tanpa menulis apa pun (aturan 2).
    if (rowsToday >= cap) {
      console.warn('Kuota baris otomatis harian ' + source + ' tercapai: ' + rowsToday);
      return json({ ok: false, capped: true });
    }
    // Kode yang sudah ada tidak pernah ditimpa. Ini yang membuat pengiriman
    // ganda tidak berbahaya, sekaligus melindungi baris yang sudah Anda
    // sunting sendiri.
    if (exists) return json({ ok: true });

    var values = {};
    values[CODE_COLUMN] = code;
    values[LAST4_COLUMN] = last4;
    values['status'] = INITIAL_STATUS;
    values['tanggal_pesan'] = stamp;
    values['tanggal_status'] = stamp;
    values['ringkasan'] = sanitizeCell_(payload.items);
    values[SOURCE_COLUMN] = source;

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
