-- Stok Titik Asal Kopi — skema database (Supabase / Postgres).
--
-- Prinsip: hak akses ditegakkan DI DATABASE (Row Level Security dan fungsi
-- security definer), bukan hanya disembunyikan di tampilan. Aplikasi memakai
-- anon key yang memang publik; yang membatasi siapa melihat apa adalah aturan
-- di berkas ini.
--
-- Peran:
--   owner  — melihat semuanya, mengatur varian, harga, batas stok, dan tim.
--   gudang — mencatat barang masuk, melihat stok.
--   sales  — mencatat penjualan dan uang diterima, melihat stok dan
--            penjualannya sendiri.
-- Akun yang belum mengklaim undangan tidak bisa membaca atau menulis apa pun.

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.peran as enum ('owner', 'gudang', 'sales');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------
-- Tabel
-- ------------------------------------------------------------------

-- Satu varian = satu jenis kopi + satu ukuran = satu QR.
-- `kode` sama dengan id varian di katalog web, karena QR berisi
-- https://titikasalkopi.vercel.app/q/<kode>. Kode yang sudah tercetak di
-- stiker tidak boleh diganti; nonaktifkan varian alih-alih menghapusnya.
create table if not exists public.varian (
  kode       text primary key check (kode ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(kode) <= 40),
  jenis      text not null check (char_length(jenis) between 1 and 40),
  ukuran     text not null check (char_length(ukuran) between 1 and 20),
  harga      integer not null check (harga >= 0),
  batas_min  integer not null default 10 check (batas_min >= 0),
  aktif      boolean not null default true,
  urutan     integer not null default 0,
  dibuat_at  timestamptz not null default now()
);

create table if not exists public.anggota (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  nama         text not null check (char_length(nama) between 1 and 60),
  email        text,
  peran        public.peran not null,
  aktif        boolean not null default true,
  bergabung_at timestamptz not null default now()
);

create table if not exists public.undangan (
  kode           text primary key,
  nama           text not null check (char_length(nama) between 1 and 60),
  peran          public.peran not null,
  dibuat_oleh    uuid references auth.users (id) on delete set null,
  dibuat_at      timestamptz not null default now(),
  kedaluwarsa_at timestamptz not null default now() + interval '7 days',
  dipakai_oleh   uuid references auth.users (id) on delete set null,
  dipakai_at     timestamptz
);

create table if not exists public.barang_masuk (
  id           bigint generated always as identity primary key,
  kode_varian  text not null references public.varian (kode),
  jumlah       integer not null check (jumlah between 1 and 10000),
  catatan      text check (catatan is null or char_length(catatan) <= 200),
  oleh         uuid not null default auth.uid() references auth.users (id),
  waktu        timestamptz not null default now()
);
create index if not exists barang_masuk_waktu_idx on public.barang_masuk (waktu desc);

create table if not exists public.penjualan (
  id             bigint generated always as identity primary key,
  uang_diterima  integer not null check (uang_diterima between 0 and 1000000000),
  oleh           uuid not null references auth.users (id),
  waktu          timestamptz not null default now()
);
create index if not exists penjualan_waktu_idx on public.penjualan (waktu desc);

-- Data yang diimpor dari catatan lama (/kas), lihat scripts/impor-kas.mjs.
-- Penjualan impor membawa uang dan rinciannya. Untuk setiap varian, barang
-- masuk impor ("stok awal") sama dengan jumlah terjualnya, sehingga stok
-- setelah impor tepat 0 dan app mulai menghitung dari situ. Penanda `impor`
-- membuat impor bisa diulang tanpa menyentuh data yang dicatat lewat app.
alter table public.penjualan add column if not exists catatan text
  check (catatan is null or char_length(catatan) <= 500);
alter table public.penjualan add column if not exists impor boolean not null default false;
alter table public.barang_masuk add column if not exists impor boolean not null default false;

create table if not exists public.penjualan_item (
  id            bigint generated always as identity primary key,
  penjualan_id  bigint not null references public.penjualan (id) on delete cascade,
  kode_varian   text not null references public.varian (kode),
  jumlah        integer not null check (jumlah between 1 and 1000),
  -- Harga katalog SAAT terjual. Uang yang benar-benar masuk ada di
  -- penjualan.uang_diterima (bisa lebih kecil kalau ada diskon).
  harga_satuan  integer not null check (harga_satuan >= 0)
);
create index if not exists penjualan_item_penjualan_idx on public.penjualan_item (penjualan_id);

-- ------------------------------------------------------------------
-- Kas (hanya owner). Owner = pemodal. Rumusnya sama dengan halaman /kas
-- lama; lihat hitungKas() di src/lib.js.
-- ------------------------------------------------------------------

create table if not exists public.pemodal (
  nama    text primary key check (char_length(nama) between 1 and 40 and nama not in ('Kas', 'Bersama')),
  modal   integer not null default 500000 check (modal >= 0),
  urutan  integer not null default 0
);

create table if not exists public.belanja (
  id              bigint generated always as identity primary key,
  tanggal         date,
  item            text not null check (char_length(item) between 1 and 120),
  sumber          text check (sumber is null or char_length(sumber) <= 120),
  kategori        text not null check (kategori in ('Kopi', 'Peralatan & kemasan', 'Lainnya')),
  batch           text check (batch is null or char_length(batch) <= 20),
  qty             integer not null default 1 check (qty between 1 and 100000),
  harga           integer not null check (harga between 0 and 1000000000),
  jumlah          integer generated always as (qty * harga) stored,
  -- Nama pemodal yang membayar, atau 'Kas' bila dibayar dari uang usaha.
  dibayar_oleh    text not null check (char_length(dibayar_oleh) between 1 and 40),
  -- 'Bersama' untuk belanja usaha, atau nama pemodal untuk kopi pribadi.
  dibebankan_ke   text not null default 'Bersama' check (char_length(dibebankan_ke) between 1 and 40),
  masuk_hitungan  boolean not null default true,
  catatan         text check (catatan is null or char_length(catatan) <= 200),
  impor           boolean not null default false,
  oleh            uuid references auth.users (id) on delete set null default auth.uid(),
  dibuat_at       timestamptz not null default now()
);

create table if not exists public.setoran (
  id          bigint generated always as identity primary key,
  tanggal     date,
  nama        text not null references public.pemodal (nama) on update cascade,
  jumlah      integer not null check (jumlah between 1 and 1000000000),
  keterangan  text check (keterangan is null or char_length(keterangan) <= 200),
  impor       boolean not null default false,
  oleh        uuid references auth.users (id) on delete set null default auth.uid(),
  dibuat_at   timestamptz not null default now()
);

-- Talangan yang sudah dikembalikan dari uang usaha ke pemodal.
create table if not exists public.pengembalian (
  id          bigint generated always as identity primary key,
  tanggal     date,
  nama        text not null references public.pemodal (nama) on update cascade,
  jumlah      integer not null check (jumlah between 1 and 1000000000),
  keterangan  text check (keterangan is null or char_length(keterangan) <= 200),
  impor       boolean not null default false,
  oleh        uuid references auth.users (id) on delete set null default auth.uid(),
  dibuat_at   timestamptz not null default now()
);

create table if not exists public.po (
  batch   text primary key check (char_length(batch) between 1 and 20),
  -- Boleh kosong sejak 26 Nov 2026: PO bisa diisi per beans per pcs (po_item).
  kg      numeric(8, 2) check (kg > 0),
  status  text not null check (status in ('Dalam proses', 'Berjalan', 'Habis terjual')),
  urutan  integer not null default 0
);
alter table public.po alter column kg drop not null;

-- Rincian PO: beans apa dan berapa (pcs atau kg) per batch.
create table if not exists public.po_item (
  id      bigint generated always as identity primary key,
  batch   text not null references public.po (batch) on update cascade on delete cascade,
  beans   text not null check (char_length(beans) between 1 and 60),
  qty     numeric(8, 2) not null check (qty > 0),
  satuan  text not null default 'pcs' check (satuan in ('pcs', 'kg')),
  urutan  integer not null default 0
);

-- ------------------------------------------------------------------
-- Peran pengguna saat ini
-- ------------------------------------------------------------------

create or replace function public.peran_saya()
returns public.peran
language sql stable security definer set search_path = public
as $$
  select peran from public.anggota where user_id = auth.uid() and aktif
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------

alter table public.varian         enable row level security;
alter table public.anggota        enable row level security;
alter table public.undangan       enable row level security;
alter table public.barang_masuk   enable row level security;
alter table public.penjualan      enable row level security;
alter table public.penjualan_item enable row level security;

drop policy if exists varian_baca on public.varian;
create policy varian_baca on public.varian for select to authenticated
  using (public.peran_saya() is not null);
drop policy if exists varian_tambah on public.varian;
create policy varian_tambah on public.varian for insert to authenticated
  with check (public.peran_saya() = 'owner');
drop policy if exists varian_ubah on public.varian;
create policy varian_ubah on public.varian for update to authenticated
  using (public.peran_saya() = 'owner') with check (public.peran_saya() = 'owner');

drop policy if exists anggota_baca on public.anggota;
create policy anggota_baca on public.anggota for select to authenticated
  using (user_id = auth.uid() or public.peran_saya() = 'owner');
-- Owner boleh mengubah peran atau menonaktifkan anggota LAIN. Mengubah diri
-- sendiri diblokir supaya owner tidak bisa mengunci dirinya keluar.
drop policy if exists anggota_ubah on public.anggota;
create policy anggota_ubah on public.anggota for update to authenticated
  using (public.peran_saya() = 'owner' and user_id <> auth.uid())
  with check (public.peran_saya() = 'owner' and user_id <> auth.uid());

drop policy if exists undangan_baca on public.undangan;
create policy undangan_baca on public.undangan for select to authenticated
  using (public.peran_saya() = 'owner');
drop policy if exists undangan_hapus on public.undangan;
create policy undangan_hapus on public.undangan for delete to authenticated
  using (public.peran_saya() = 'owner' and dipakai_oleh is null);

drop policy if exists masuk_baca on public.barang_masuk;
create policy masuk_baca on public.barang_masuk for select to authenticated
  using (public.peran_saya() in ('owner', 'gudang'));
drop policy if exists masuk_tambah on public.barang_masuk;
create policy masuk_tambah on public.barang_masuk for insert to authenticated
  with check (public.peran_saya() in ('owner', 'gudang') and oleh = auth.uid());

drop policy if exists jual_baca on public.penjualan;
create policy jual_baca on public.penjualan for select to authenticated
  using (public.peran_saya() = 'owner' or (public.peran_saya() = 'sales' and oleh = auth.uid()));

drop policy if exists jual_item_baca on public.penjualan_item;
create policy jual_item_baca on public.penjualan_item for select to authenticated
  using (exists (select 1 from public.penjualan p where p.id = penjualan_id));

-- Kas: hanya owner, untuk semua perintah.
alter table public.pemodal      enable row level security;
alter table public.belanja      enable row level security;
alter table public.setoran      enable row level security;
alter table public.pengembalian enable row level security;
alter table public.po           enable row level security;
alter table public.po_item      enable row level security;
do $$ declare t text; begin
  foreach t in array array['pemodal', 'belanja', 'setoran', 'pengembalian', 'po', 'po_item'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.peran_saya() = ''owner'') with check (public.peran_saya() = ''owner'')',
      t || '_owner', t);
  end loop;
end $$;

-- Penjualan hanya lewat catat_penjualan(): satu transaksi untuk kepala dan
-- seluruh barisnya, dengan harga katalog diambil dari database.

-- ------------------------------------------------------------------
-- Fungsi
-- ------------------------------------------------------------------

create or replace function public.buat_kode_undangan()
returns text
language plpgsql volatile set search_path = public, extensions
as $$
declare
  abjad constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  hasil text := '';
begin
  for i in 0..7 loop
    hasil := hasil || substr(abjad, (get_byte(b, i) % 32) + 1, 1);
    if i = 3 then hasil := hasil || '-'; end if;
  end loop;
  return hasil;
end
$$;

create or replace function public.buat_undangan(p_nama text, p_peran public.peran)
returns text
language plpgsql security definer set search_path = public
as $$
declare k text;
begin
  if public.peran_saya() is distinct from 'owner' then
    raise exception 'Hanya owner yang bisa mengundang.' using errcode = '42501';
  end if;
  loop
    k := public.buat_kode_undangan();
    exit when not exists (select 1 from public.undangan where kode = k);
  end loop;
  insert into public.undangan (kode, nama, peran, dibuat_oleh)
  values (k, btrim(p_nama), p_peran, auth.uid());
  return k;
end
$$;

create or replace function public.klaim_undangan(p_kode text)
returns public.peran
language plpgsql security definer set search_path = public
as $$
declare u public.undangan%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Masuk dulu sebelum memakai kode undangan.' using errcode = '42501';
  end if;
  if exists (select 1 from public.anggota where user_id = auth.uid()) then
    raise exception 'Akun ini sudah terdaftar.' using errcode = '23505';
  end if;
  select * into u from public.undangan
   where kode = upper(btrim(p_kode))
   for update;
  if not found or u.dipakai_oleh is not null or u.kedaluwarsa_at < now() then
    raise exception 'Kode undangan tidak berlaku. Minta kode baru ke owner.' using errcode = 'P0002';
  end if;
  insert into public.anggota (user_id, nama, email, peran)
  values (auth.uid(), u.nama, auth.jwt() ->> 'email', u.peran);
  update public.undangan set dipakai_oleh = auth.uid(), dipakai_at = now() where kode = u.kode;
  return u.peran;
end
$$;

create or replace function public.catat_penjualan(p_items jsonb, p_uang integer)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  pid bigint;
  it jsonb;
  v public.varian%rowtype;
  n integer;
begin
  if public.peran_saya() is null or public.peran_saya() not in ('owner', 'sales') then
    raise exception 'Hanya sales atau owner yang bisa mencatat penjualan.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Penjualan kosong.' using errcode = '22023';
  end if;
  if p_uang is null or p_uang < 0 then
    raise exception 'Uang diterima tidak valid.' using errcode = '22023';
  end if;
  insert into public.penjualan (uang_diterima, oleh) values (p_uang, auth.uid()) returning id into pid;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into v from public.varian where kode = it ->> 'kode' and aktif;
    if not found then
      raise exception 'Varian % tidak dikenal.', it ->> 'kode' using errcode = 'P0002';
    end if;
    n := (it ->> 'jumlah')::integer;
    insert into public.penjualan_item (penjualan_id, kode_varian, jumlah, harga_satuan)
    values (pid, v.kode, n, v.harga);
  end loop;
  return pid;
end
$$;

-- Stok = total masuk − total terjual, per varian. Semua anggota boleh
-- melihatnya, termasuk yang tidak boleh membaca rincian penjualan.
-- `total_masuk` = 0 berarti varian ini belum pernah punya stok (mis. single
-- origin yang belum dijual): app tidak memberi peringatan pesan untuknya.
drop function if exists public.stok_saat_ini();
create function public.stok_saat_ini()
returns table (kode text, jenis text, ukuran text, harga integer, batas_min integer,
               aktif boolean, urutan integer, stok integer, total_masuk integer)
language sql stable security definer set search_path = public
as $$
  select v.kode, v.jenis, v.ukuran, v.harga, v.batas_min, v.aktif, v.urutan,
         (coalesce((select sum(m.jumlah) from public.barang_masuk m where m.kode_varian = v.kode), 0)
        - coalesce((select sum(i.jumlah) from public.penjualan_item i where i.kode_varian = v.kode), 0))::integer,
         coalesce((select sum(m.jumlah) from public.barang_masuk m where m.kode_varian = v.kode), 0)::integer
    from public.varian v
   where public.peran_saya() is not null
   order by v.urutan, v.kode
$$;

-- ------------------------------------------------------------------
-- Hak eksekusi dan tabel
-- ------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.peran_saya(), public.buat_undangan(text, public.peran),
  public.klaim_undangan(text), public.catat_penjualan(jsonb, integer), public.stok_saat_ini()
  to authenticated;
revoke execute on function public.buat_kode_undangan() from authenticated;

-- Pembaruan langsung ke layar owner dan gudang.
do $$ begin
  alter publication supabase_realtime add table public.barang_masuk, public.penjualan;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------
-- Data awal: varian dari katalog web (kode = id varian web, harga web).
-- ------------------------------------------------------------------

insert into public.varian (kode, jenis, ukuran, harga, batas_min, urutan) values
  ('bold-100g',   'BOLD',   '100 gr', 45000, 10, 10),
  ('bold-200g',   'BOLD',   '200 gr', 80000, 10, 20),
  ('bright-100g', 'BRIGHT', '100 gr', 55000, 10, 30),
  ('bright-200g', 'BRIGHT', '200 gr', 95000, 10, 40),
  ('abmisibil-mini1',   'ABMISIBIL',   '100 gr',  85000, 5, 110),
  ('abmisibil-pack1',   'ABMISIBIL',   '200 gr', 150000, 5, 111),
  ('sabin-mini1',       'SABIN',       '100 gr',  85000, 5, 120),
  ('sabin-pack1',       'SABIN',       '200 gr', 150000, 5, 121),
  ('pyramid-mini1',     'PYRAMID',     '100 gr',  85000, 5, 130),
  ('pyramid-pack1',     'PYRAMID',     '200 gr', 150000, 5, 131),
  ('oelbiteno-mini1',   'OELBITENO',   '100 gr',  85000, 5, 140),
  ('oelbiteno-pack1',   'OELBITENO',   '200 gr', 150000, 5, 141),
  ('pondok-baru-mini1', 'PONDOK BARU', '100 gr',  70000, 5, 150),
  ('pondok-baru-pack1', 'PONDOK BARU', '200 gr', 150000, 5, 151),
  ('kerinci-mini1',     'KERINCI',     '100 gr',  70000, 5, 160),
  ('kerinci-pack1',     'KERINCI',     '200 gr', 150000, 5, 161),
  ('palimping-mini1',   'PALIMPING',   '100 gr',  70000, 5, 170),
  ('palimping-pack1',   'PALIMPING',   '200 gr', 150000, 5, 171),
  ('sindoro-pack1',     'SINDORO',     '200 gr', 150000, 5, 181),
  -- Peneli tidak ada di katalog web; halaman /q-nya ada di web/src/data/qr.ts
  -- (diLuarKatalog). Harga sementara mengikuti Pondok Baru (harga beli sama).
  ('peneli-mini1',      'PENELI',      '100 gr',  70000, 5, 190),
  ('peneli-pack1',      'PENELI',      '200 gr', 150000, 5, 191),
  -- Single origin baru (owner, 26 Nov 2026); halaman /q-nya di web/src/data/qr.ts.
  ('gn-tiom-pack1',            'GN. TIOM',           '200 gr', 150000, 5, 200),
  ('solok-honey-wash-pack1',   'SOLOK HONEY & WASH', '200 gr', 150000, 5, 210),
  ('kersamanah-anaerob-pack1', 'KERSAMANAH ANAEROB', '200 gr', 150000, 5, 220),
  ('yellow-bourbon-pack1',     'YELLOW BOURBON',     '200 gr', 150000, 5, 230),
  ('manglayang-honey-pack1',   'MANGLAYANG HONEY',   '200 gr', 150000, 5, 240),
  ('blueberry-infused-pack1',  'BLUEBERRY INFUSED',  '200 gr', 150000, 5, 250)
on conflict (kode) do nothing;
