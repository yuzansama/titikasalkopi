import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Aturan ketergantungan docs/03-architecture.md Bagian 4.3.
 * Arah impor hanya satu arah: app -> features -> components/lib, dan hanya
 * data/catalog.ts yang boleh membaca lapis penulisan data/products.ts (ADR-02).
 *
 * Catatan penyimpangan yang disengaja dari potongan kode di dokumen:
 * `@/data/types` TIDAK ikut dilarang di components/ dan lib/. Tipe dihapus saat
 * kompilasi sehingga nol byte masuk bundel klien — larangan itu hanya akan
 * memaksa penyalinan tipe, yang justru memecah kontrak Bagian 5.2.
 * Yang dilarang adalah modul yang membawa DATA: `@/data/catalog` dan
 * `@/data/products`.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: "tak/leaf-layers-tidak-mengenal-katalog",
    files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/catalog", "@/data/products"],
              message:
                "components/ dan lib/ tidak boleh membaca katalog. Terima lewat props, atau impor tipe saja dari @/data/types.",
            },
            {
              group: ["@/features/*"],
              message:
                "Arah impor hanya satu arah: features -> components/lib, tidak sebaliknya.",
            },
          ],
        },
      ],
    },
  },

  {
    name: "tak/lapis-penulisan-hanya-untuk-catalog",
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/data/catalog.ts",
      "src/data/validate.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/products"],
              message:
                "Baca dari @/data/catalog, bukan dari lapis penulisan (ADR-02).",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
