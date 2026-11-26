-- 26 Nov 2026 — jalankan SEKALI di SQL editor Supabase (project stok-titikasalkopi).
-- Aman diulang: setiap langkah memeriksa dulu apa yang sudah ada.
-- Setelahnya jalankan supabase/test_rls.sql (selalu di-ROLLBACK).

begin;

-- 1. PO bisa diisi per beans per pcs ------------------------------------
alter table public.po alter column kg drop not null;

create table if not exists public.po_item (
  id      bigint generated always as identity primary key,
  batch   text not null references public.po (batch) on update cascade on delete cascade,
  beans   text not null check (char_length(beans) between 1 and 60),
  qty     numeric(8, 2) not null check (qty > 0),
  satuan  text not null default 'pcs' check (satuan in ('pcs', 'kg')),
  urutan  integer not null default 0
);
alter table public.po_item enable row level security;
drop policy if exists po_item_owner on public.po_item;
create policy po_item_owner on public.po_item for all to authenticated
  using (public.peran_saya() = 'owner') with check (public.peran_saya() = 'owner');

-- 2. Semua single origin Rp150.000 / 200 gr ------------------------------
update public.varian set harga = 150000
where kode in ('oelbiteno-pack1', 'abmisibil-pack1', 'sabin-pack1', 'pyramid-pack1', 'palimping-pack1',
               'kerinci-pack1', 'pondok-baru-pack1', 'sindoro-pack1', 'peneli-pack1');

-- 3. Single origin baru (Peneli sudah ada) -------------------------------
insert into public.varian (kode, jenis, ukuran, harga, batas_min, urutan) values
  ('gn-tiom-pack1',            'GN. TIOM',           '200 gr', 150000, 5, 200),
  ('solok-honey-wash-pack1',   'SOLOK HONEY & WASH', '200 gr', 150000, 5, 210),
  ('kersamanah-anaerob-pack1', 'KERSAMANAH ANAEROB', '200 gr', 150000, 5, 220),
  ('yellow-bourbon-pack1',     'YELLOW BOURBON',     '200 gr', 150000, 5, 230),
  ('manglayang-honey-pack1',   'MANGLAYANG HONEY',   '200 gr', 150000, 5, 240),
  ('blueberry-infused-pack1',  'BLUEBERRY INFUSED',  '200 gr', 150000, 5, 250)
on conflict (kode) do nothing;

-- 4. Kosong: Pyramid, Abmisibil, Kerinci (dinonaktifkan, tidak dihapus:
--    kodenya sudah tercetak di stiker dan riwayat stoknya tetap ada).
update public.varian set aktif = false
where kode in ('pyramid-mini1', 'pyramid-pack1', 'abmisibil-mini1', 'abmisibil-pack1', 'kerinci-mini1', 'kerinci-pack1');

-- 5. PO Batch 3,5 --------------------------------------------------------
insert into public.po (batch, kg, status, urutan)
values ('3,5', null, 'Dalam proses', (select coalesce(max(urutan) + 1, 0) from public.po))
on conflict (batch) do nothing;

insert into public.po_item (batch, beans, qty, satuan, urutan)
select '3,5', b.beans, b.qty, b.satuan, b.urutan
from (values
  ('Yellow Bourbon', 2, 'pcs', 0),
  ('Gunung Tilu',    2, 'pcs', 1),
  ('Solok',          2, 'pcs', 2),
  ('Blueberry',      3, 'pcs', 3),
  ('Full Robusta',   2, 'kg',  4)
) as b (beans, qty, satuan, urutan)
where not exists (select 1 from public.po_item i where i.batch = '3,5' and i.beans = b.beans);

commit;

-- Cek cepat:
-- select kode, jenis, harga, aktif from public.varian order by urutan;
-- select * from public.po_item where batch = '3,5' order by urutan;
