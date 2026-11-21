import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi.");
}

export const sb = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

function ok({ data, error }) {
  if (error) throw error;
  return data;
}

export const api = {
  async sesi() {
    return ok(await sb.auth.getSession()).session;
  },
  async masuk(email, password) {
    return ok(await sb.auth.signInWithPassword({ email, password }));
  },
  async daftar(email, password) {
    return ok(await sb.auth.signUp({ email, password }));
  },
  async keluar() {
    await sb.auth.signOut();
  },

  /** Baris anggota milik pengguna ini, atau null bila belum diundang. */
  async anggotaSaya(userId) {
    return ok(
      await sb.from("anggota").select("user_id,nama,email,peran,aktif").eq("user_id", userId).maybeSingle(),
    );
  },
  async klaimUndangan(kode) {
    return ok(await sb.rpc("klaim_undangan", { p_kode: kode }));
  },

  async stok() {
    return ok(await sb.rpc("stok_saat_ini"));
  },
  async catatMasuk(kode, jumlah, catatan) {
    const { data: u } = await sb.auth.getUser();
    return ok(
      await sb.from("barang_masuk").insert({
        kode_varian: kode,
        jumlah,
        catatan: catatan || null,
        oleh: u.user.id,
      }),
    );
  },
  async masukTerakhir(limit = 10) {
    return ok(
      await sb
        .from("barang_masuk")
        .select("id,kode_varian,jumlah,catatan,waktu")
        .order("waktu", { ascending: false })
        .limit(limit),
    );
  },
  async catatJual(items, uang) {
    return ok(await sb.rpc("catat_penjualan", { p_items: items, p_uang: uang }));
  },
  /** Penjualan sejak `sejak` (Date) atau semua bila null. Owner melihat semua; sales hanya miliknya. */
  async penjualan({ sejak = null, oleh = null } = {}) {
    let q = sb
      .from("penjualan")
      .select("id,uang_diterima,oleh,waktu,penjualan_item(kode_varian,jumlah,harga_satuan)")
      .order("waktu", { ascending: false })
      .limit(5000);
    if (sejak) q = q.gte("waktu", sejak.toISOString());
    if (oleh) q = q.eq("oleh", oleh);
    return ok(await q);
  },

  async anggota() {
    return ok(await sb.from("anggota").select("user_id,nama,email,peran,aktif,bergabung_at").order("bergabung_at"));
  },
  async ubahAnggota(userId, perubahan) {
    return ok(await sb.from("anggota").update(perubahan).eq("user_id", userId).select());
  },
  async undanganAktif() {
    return ok(
      await sb
        .from("undangan")
        .select("kode,nama,peran,kedaluwarsa_at")
        .is("dipakai_oleh", null)
        .gt("kedaluwarsa_at", new Date().toISOString())
        .order("dibuat_at", { ascending: false }),
    );
  },
  async buatUndangan(nama, peran) {
    return ok(await sb.rpc("buat_undangan", { p_nama: nama, p_peran: peran }));
  },
  async cabutUndangan(kode) {
    return ok(await sb.from("undangan").delete().eq("kode", kode));
  },

  async ubahVarian(kode, perubahan) {
    return ok(await sb.from("varian").update(perubahan).eq("kode", kode).select());
  },
  async tambahVarian(v) {
    return ok(await sb.from("varian").insert(v).select());
  },

  /** Pembaruan langsung bila ada barang masuk atau penjualan baru. Mengembalikan fungsi berhenti. */
  dengarkan(onChange) {
    const ch = sb
      .channel(`stok-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "barang_masuk" }, onChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "penjualan" }, onChange)
      .subscribe();
    return () => sb.removeChannel(ch);
  },
};
