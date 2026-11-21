-- Uji aturan akses per peran. Berjalan dalam satu transaksi dan selalu
-- di-ROLLBACK, jadi aman dijalankan pada database produksi:
--   SQL editor Supabase, atau Management API database/query.
-- Gagal = query berhenti dengan pesan 'GAGAL: ...'.

begin;

-- Database ini dipakai sungguhan, jadi uji membandingkan dengan keadaan awal,
-- bukan dengan nol. Nilai awal disimpan di setting transaksi supaya terbaca
-- dari peran mana pun.
create function pg_temp.stok_mentah(k text) returns integer language sql as $f$
  select (coalesce((select sum(jumlah) from public.barang_masuk where kode_varian = k), 0)
        - coalesce((select sum(jumlah) from public.penjualan_item where kode_varian = k), 0))::integer
$f$;
select set_config('uji.bold100', pg_temp.stok_mentah('bold-100g')::text, true),
       set_config('uji.sabin200', pg_temp.stok_mentah('sabin-pack1')::text, true),
       set_config('uji.jual', (select count(*) from public.penjualan)::text, true),
       set_config('uji.masuk', (select count(*) from public.barang_masuk)::text, true),
       set_config('uji.impor', (select count(*) from public.penjualan where impor)::text, true);

-- Empat akun uji.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@uji.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'gudang@uji.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'sales@uji.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'asing@uji.test',  'authenticated', 'authenticated');

insert into public.undangan (kode, nama, peran, kedaluwarsa_at) values
  ('UJIO-0001', 'Owner uji',  'owner',  now() + interval '1 day'),
  ('UJIG-0001', 'Gudang uji', 'gudang', now() + interval '1 day'),
  ('UJIS-0001', 'Sales uji',  'sales',  now() + interval '1 day'),
  ('UJIX-LAMA', 'Kedaluwarsa', 'sales', now() - interval '1 day');

-- ---------------- owner ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if public.klaim_undangan(' ujio-0001 ') <> 'owner' then raise exception 'GAGAL: owner tidak terklaim'; end if;
  if public.buat_undangan('Coba', 'sales') !~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$' then raise exception 'GAGAL: format kode undangan'; end if;
  if (select count(*) from public.varian) < 4 then raise exception 'GAGAL: owner tidak melihat varian'; end if;
end $$;

reset role;

-- ---------------- gudang ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","email":"gudang@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if public.klaim_undangan('UJIG-0001') <> 'gudang' then raise exception 'GAGAL: gudang tidak terklaim'; end if;
  insert into public.barang_masuk (kode_varian, jumlah, catatan) values ('bold-100g', 30, 'uji');
  begin
    perform public.catat_penjualan('[{"kode":"bold-100g","jumlah":1}]', 45000);
    raise exception 'GAGAL: gudang bisa mencatat penjualan';
  exception when insufficient_privilege then null; end;
  update public.varian set harga = 1 where kode = 'bold-100g';
  if (select harga from public.varian where kode = 'bold-100g') = 1 then raise exception 'GAGAL: gudang bisa mengubah harga'; end if;
  begin
    perform public.buat_undangan('Nyusup', 'owner');
    raise exception 'GAGAL: gudang bisa mengundang';
  exception when insufficient_privilege then null; end;
  begin
    perform public.klaim_undangan('UJIS-0001');
    raise exception 'GAGAL: anggota bisa mengklaim undangan kedua';
  exception when unique_violation then null; end;
end $$;

reset role;

-- ---------------- sales ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","email":"sales@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  begin
    perform public.klaim_undangan('UJIX-LAMA');
    raise exception 'GAGAL: undangan kedaluwarsa bisa dipakai';
  exception when no_data_found then null; end;
  if public.klaim_undangan('UJIS-0001') <> 'sales' then raise exception 'GAGAL: sales tidak terklaim'; end if;
  perform public.catat_penjualan('[{"kode":"bold-100g","jumlah":2}]', 85000);
  if (select stok from public.stok_saat_ini() where kode = 'bold-100g') <> current_setting('uji.bold100')::int + 28 then raise exception 'GAGAL: stok bukan 30 - 2'; end if;
  if (select harga_satuan from public.penjualan_item limit 1) <> 45000 then raise exception 'GAGAL: harga katalog tidak tercatat'; end if;
  if (select impor from public.penjualan limit 1) then raise exception 'GAGAL: penjualan app tertandai impor'; end if;
  if (select count(*) from public.barang_masuk) <> 0 then raise exception 'GAGAL: sales melihat barang masuk'; end if;
  if (select count(*) from public.anggota) <> 1 then raise exception 'GAGAL: sales melihat anggota lain'; end if;
  begin
    insert into public.barang_masuk (kode_varian, jumlah) values ('bold-100g', 5);
    raise exception 'GAGAL: sales bisa mencatat barang masuk';
  exception when insufficient_privilege then null; end;
  begin
    perform public.catat_penjualan('[{"kode":"tidak-ada","jumlah":1}]', 1);
    raise exception 'GAGAL: varian tak dikenal diterima';
  exception when no_data_found then null; end;
end $$;

reset role;

-- ---------------- bukan anggota ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","email":"asing@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select count(*) from public.varian) <> 0 then raise exception 'GAGAL: orang asing melihat varian'; end if;
  if (select count(*) from public.stok_saat_ini()) <> 0 then raise exception 'GAGAL: orang asing melihat stok'; end if;
  if (select count(*) from public.penjualan) <> 0 then raise exception 'GAGAL: orang asing melihat penjualan'; end if;
  begin
    perform public.klaim_undangan('UJIG-0001');
    raise exception 'GAGAL: kode bekas bisa dipakai ulang';
  exception when no_data_found then null; end;
  begin
    perform public.catat_penjualan('[{"kode":"bold-100g","jumlah":1}]', 1);
    raise exception 'GAGAL: orang asing bisa mencatat penjualan';
  exception when insufficient_privilege then null; end;
end $$;

reset role;

-- ---------------- owner lagi ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select count(*) from public.penjualan) <> current_setting('uji.jual')::int + 1 then raise exception 'GAGAL: owner tidak melihat penjualan'; end if;
  if (select count(*) from public.barang_masuk) <> current_setting('uji.masuk')::int + 1 then raise exception 'GAGAL: owner tidak melihat barang masuk'; end if;
  update public.anggota set aktif = false where user_id = '00000000-0000-0000-0000-0000000000a1';
  if not (select aktif from public.anggota where user_id = '00000000-0000-0000-0000-0000000000a1') then
    raise exception 'GAGAL: owner bisa menonaktifkan dirinya sendiri';
  end if;
  update public.anggota set aktif = false where user_id = '00000000-0000-0000-0000-0000000000a2';
  update public.varian set harga = 46000 where kode = 'bold-100g';
  if (select harga from public.varian where kode = 'bold-100g') <> 46000 then raise exception 'GAGAL: owner tidak bisa mengubah harga'; end if;
end $$;

reset role;

-- ---------------- gudang setelah dinonaktifkan ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","email":"gudang@uji.test","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select count(*) from public.stok_saat_ini()) <> 0 then raise exception 'GAGAL: anggota nonaktif masih melihat stok'; end if;
  begin
    insert into public.barang_masuk (kode_varian, jumlah) values ('bold-100g', 1);
    raise exception 'GAGAL: anggota nonaktif masih bisa mencatat';
  exception when insufficient_privilege then null; end;
end $$;

reset role;

-- ---------------- kas: hanya owner ----------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","email":"sales@uji.test","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.belanja) + (select count(*) from public.setoran)
   + (select count(*) from public.pengembalian) + (select count(*) from public.pemodal) + (select count(*) from public.po) <> 0 then
    raise exception 'GAGAL: sales melihat data kas';
  end if;
  begin
    insert into public.belanja (item, kategori, harga, dibayar_oleh) values ('Nyusup', 'Kopi', 1, 'Kas');
    raise exception 'GAGAL: sales bisa mencatat belanja';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner@uji.test","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  insert into public.pemodal (nama) values ('Pemodal Uji');
  insert into public.setoran (nama, jumlah) values ('Pemodal Uji', 500000);
  insert into public.belanja (item, kategori, qty, harga, dibayar_oleh) values ('Uji', 'Kopi', 3, 110000, 'Pemodal Uji');
  if (select jumlah from public.belanja where item = 'Uji') <> 330000 then raise exception 'GAGAL: jumlah belanja bukan qty x harga'; end if;
  insert into public.pengembalian (nama, jumlah) values ('Pemodal Uji', 330000);
  delete from public.pengembalian where nama = 'Pemodal Uji';
  if exists (select 1 from public.pengembalian where nama = 'Pemodal Uji') then raise exception 'GAGAL: owner tidak bisa menghapus'; end if;
end $$;
reset role;

-- ---------------- anon ----------------
set local role anon;
do $$ begin
  begin
    perform count(*) from public.varian;
    raise exception 'GAGAL: anon bisa membaca tabel';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------- impor: stok awal = terjual, stok bersih tidak berubah ----------------
do $$ declare pid bigint; begin
  insert into public.penjualan (uang_diterima, oleh, impor, catatan)
  values (280000, '00000000-0000-0000-0000-0000000000a1', true, 'uji impor') returning id into pid;
  insert into public.penjualan_item (penjualan_id, kode_varian, jumlah, harga_satuan) values (pid, 'sabin-pack1', 2, 140000);
  insert into public.barang_masuk (kode_varian, jumlah, oleh, impor, catatan)
  values ('sabin-pack1', 2, '00000000-0000-0000-0000-0000000000a1', true, 'uji stok awal');
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner@uji.test","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if (select stok from public.stok_saat_ini() where kode = 'sabin-pack1') <> current_setting('uji.sabin200')::int then raise exception 'GAGAL: impor stok awal + jual tidak saling meniadakan'; end if;
  if (select stok from public.stok_saat_ini() where kode = 'bold-100g') <> current_setting('uji.bold100')::int + 28 then raise exception 'GAGAL: impor mengubah stok varian lain'; end if;
  if (select count(*) from public.penjualan where impor) <> current_setting('uji.impor')::int + 1 then raise exception 'GAGAL: owner tidak melihat penjualan impor'; end if;
  if (select count(*) from public.varian where kode like '%-pack1') < 8 then raise exception 'GAGAL: varian single origin belum ada'; end if;
end $$;
reset role;

select 'SEMUA UJI LULUS' as hasil;
rollback;
