# Changesets

Repositori ini memakai [Changesets](https://github.com/changesets/changesets) untuk
versioning dan publikasi **independen per paket**.

## Alur

1. Setiap perubahan yang perlu dirilis: jalankan `npm run changeset`, pilih paket
   yang berubah (mis. `@eka-morphis/card`) dan jenis bump (patch/minor/major), lalu
   tulis ringkasan.
2. Commit file `.changeset/*.md` bersama perubahan kode.
3. Saat siap rilis: `npm run version-packages` menaikkan versi **hanya paket yang
   berubah** dan memperbarui CHANGELOG.
4. `npm run release` mem-build dan mem-publish paket yang berubah ke npm.

Paket yang tidak berubah tidak akan di-publish dan versinya tetap.

Panduan lengkap alur rilis: [`docs/publishing.md`](../docs/publishing.md).

Lihat [dokumentasi Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md).
