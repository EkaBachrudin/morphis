# Panduan Publikasi (Changesets)

Repositori ini memakai **npm workspaces** + **Changesets** untuk mem-publish
**per paket dengan versi independen**. Memperbaiki `@eka-morphis/card` tidak memaksa
menaikkan versi `@eka-morphis/button`.

> Publish dilakukan **manual dari lokal**. CI hanya menjalankan validasi
> (`.github/workflows/ci.yml`) dan **tidak** menerbitkan paket.

## Prasyarat

- Node ≥ 22.
- Registry: **GitHub Packages** (`https://npm.pkg.github.com`). Semua paket
  scoped `@eka-morphis/*` dan sudah menyetel
  `"publishConfig": { "access": "public", "registry": "https://npm.pkg.github.com" }`.
- Repo berada di org `eka-morphis` (scope paket harus sama dengan pemilik repo).
- Auth: **PAT classic** dengan scope `write:packages`, `read:packages`, `repo`
  (GitHub Packages tidak menerima fine-grained token). CI memakai
  **`secrets.GITHUB_TOKEN`**.

## Ringkasan alur

```bash
# 1. siapkan perubahan kode + verifikasi
npm run typecheck && npm test && npm run build

# 2. catat perubahan (pilih paket + jenis bump)
npm run changeset

# 3. commit & push (atau buka PR) file .changeset/*.md

# 4. naikkan versi HANYA paket yang berubah
npm run version-packages

# 5. build + publish paket yang belum ada di registry
npm run release

# 6. tandai rilis di git (changeset publish tidak push tag)
npx changeset git-tag && git push origin --tags
```

## Autentikasi

GitHub Packages tidak mendukung alur login browser default npm. Pakai salah satu:

```bash
# Opsi A — login legacy
npm login --scope=@eka-morphis --auth-type=legacy --registry=https://npm.pkg.github.com
# Username: <username GitHub huruf kecil>  Password: <PAT classic>

# Opsi B — tulis token langsung ke ~/.npmrc
# //npm.pkg.github.com/:_authToken=ghp_xxx
```

Verifikasi: `npm whoami --registry=https://npm.pkg.github.com`.

## 1. Catat perubahan — `npm run changeset`

`changeset add` bersifat **interaktif**. Ia mendeteksi paket berubah lewat git
diff terhadap `baseBranch` (`main`) dan mengelompokkannya menjadi
**"changed packages"** / **"unchanged packages"**. Pilih paket + jenis bump +
tulis ringkasan.

Contoh file hasil (`.changeset/<acak>.md`):

```md
---
"@eka-morphis/card": patch
---

fix: perbaiki padding card saat header kosong
```

Non-interaktif:

```bash
npx changeset --patch @eka-morphis/card -m "fix: padding card"
npx changeset --minor @eka-morphis/badge -m "feat: komponen badge"
```

Perubahan yang tidak perlu rilis: `npx changeset add --empty`.

> Jika bump sebuah dependensi membuat rentang di paket lain tidak lagi memenuhi
> (mis. meta `@eka-morphis/components` `"@eka-morphis/x": "^0.1.0"` lalu x → 0.2.0),
> Changesets otomatis ikut menaikkan paket dependen itu.

> **Catatan Lit**: `@eka-morphis/core` mendeklarasikan `lit` sebagai `dependency`.
> Saat merilis perubahan fondasi (mis. migrasi ke Lit), buat changeset untuk
> `@eka-morphis/core` **dan** paket komponen yang bergantung padanya — Changesets
> akan ikut menaikkan paket dependen secara otomatis.

## 2. (Opsional) Preview

```bash
npm run changeset status                 # changeset yang ada + paket yang akan naik
npx changeset status --verbose
npx changeset publish-plan               # paket yang siap di-publish/tag (tanpa publish)
```

## 3. Naikkan versi — `npm run version-packages`

`= changeset version` (tanpa argumen paket). Ia menerapkan **semua** changeset
pending, menaikkan versi hanya paket yang tercantum, memperbarui `CHANGELOG.md`
dan rentang dependensi internal. Commit hasilnya.

```bash
npm run version-packages
git add -A && git commit -m "chore: version packages"
```

## 4. Build + publish — `npm run release`

`= npm run build && changeset publish`.

- `changeset publish` (tanpa argumen) hanya mem-publish paket yang **versinya
  belum ada di npm**, lalu membuat git tag (mis. `@eka-morphis/card@0.1.1`).
- **Catatan:** `npm run build` membangun **semua** paket (build global), bukan
  hanya yang berubah — hanya *publish* yang ter-scope.

```bash
npm run release
```

## Paket baru (publish pertama)

- `npm run gen -- component badge` membuat `@eka-morphis/badge` versi `0.1.0`.
- `changeset publish` menerbitkan versi yang belum ada di registry, jadi
  `0.1.0` bisa langsung terbit.
- Bila ingin rilis pertama lewat bump: set versi paket ke `0.0.0` lalu beri
  changeset `minor` → `0.1.0`.
- Pastikan scope `@eka-morphis` terdaftar dan Anda punya hak publish.

## Konsumsi (di project framework)

GitHub Packages **selalu butuh autentikasi untuk install**. Di tiap project
konsumen, tambahkan `.npmrc`:

```
@eka-morphis:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<PAT_dengan_read:packages>
```

Lalu `npm install @eka-morphis/other-offer @eka-morphis/tokens`. Panduan per
framework (React wrapper, Vue `isCustomElement`, Angular `CUSTOM_ELEMENTS_SCHEMA`
+ penanganan `TS2882` untuk import `tokens.css`, tag mentah + augmentasi TS) ada
di [`docs/react-typescript.md`](react-typescript.md),
[`docs/angular.md`](angular.md), dan README.

## Pre-release (opsional)

```bash
npx changeset pre enter next      # mode prerelease (tag `next`)
npm run changeset && npm run version-packages && npm run release
npx changeset pre exit
```

## Troubleshooting

- **"No unpublished projects to publish"** — tidak ada versi baru; jalankan
  `version-packages` dulu.
- **Lupa changeset** — tambah changeset lalu `version-packages` + `release`.
- **Salah publish** — `npm deprecate <pkg>@<version> "pesan"`; `npm unpublish`
  hanya dalam 72 jam dan hindari untuk versi yang sudah dipakai.
- **2FA** — siapkan OTP; CI pakai automation token.
- **Scope/izin** — pastikan `@eka-morphis` milik akun/org dan token punya hak
  `publish`.

## Checklist rilis

- [ ] `npm run typecheck`, `npm test`, `npm run build` hijau.
- [ ] `npm pack --dry-run -w @eka-morphis/<pkg>` berisi `dist/` saja.
- [ ] Changeset dibuat & di-commit.
- [ ] `npm run version-packages` dijalankan.
- [ ] `npm run release`.
- [ ] `npx changeset git-tag && git push origin --tags`.
- [ ] Verifikasi di GitHub Packages + git tag dibuat.

## Referensi

- Changesets: https://github.com/changesets/changesets
- `npm publish` / `npm deprecate`: https://docs.npmjs.com/cli/
