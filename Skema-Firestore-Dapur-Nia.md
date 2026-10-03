oke b

BOOTCAMP AI WEB PROGRAMMING · SESI 3
Skema Firestore Dapur Nia
Daftar koleksi dan field yang dibuat di Cloud Firestore untuk App 2 Dapur Nia

1. Gambaran Umum
   App 2 Dapur Nia memakai tiga koleksi. Nama koleksi dan field di dokumen ini dipakai apa adanya. Usulan nama berbeda dari agen AI wajib diperiksa dulu.
   Koleksi
   Isi
   ID dokumen
   menu
   Daftar menu, harga, dan sisa porsi
   Otomatis
   pelanggan
   Nama, nomor WhatsApp, dan alamat
   Nomor WhatsApp
   pesanan
   Pesanan, total tagihan, dan status
   Otomatis
   Hubungan antarkoleksi:
   pelanggan (1) ──── (banyak) pesanan (banyak) ──── (1) menu
   Satu pelanggan dapat memiliki banyak pesanan. Satu menu dapat muncul di banyak pesanan. Satu pesanan hanya berisi satu menu.
   Laporan harian tidak memakai koleksi sendiri. Laporan dihitung dari koleksi pesanan.
2. Aturan Penulisan
   Aturan
   Contoh
   Nama koleksi huruf kecil, bentuk tunggal
   menu, pelanggan, pesanan
   Nama field huruf kecil dengan garis bawah
   sisa_porsi, harga_satuan
   Uang disimpan sebagai angka bulat rupiah, tanpa titik
   25000, bukan "25.000"
   Tanggal pesanan disimpan sebagai teks
   "2026-10-01"
   Waktu pembuatan diisi oleh server Firestore
   serverTimestamp()
3. Koleksi menu
   Menyimpan daftar menu harian, harga, dan sisa porsi. ID dokumen dibuat otomatis oleh Firestore.
   Field
   Tipe
   Wajib
   Keterangan
   nama
   string
   Ya
   Nama menu, 1 sampai 60 karakter
   harga
   number (bulat)
   Ya
   Harga per porsi, minimal 0
   sisa_porsi
   number (bulat)
   Ya
   Minimal 0. Nilai 0 ditampilkan sebagai Habis
   tersedia
   boolean
   Ya
   true tampil di daftar, false disembunyikan
   dibuat_pada
   timestamp
   Ya
   Waktu dokumen dibuat
   Contoh dokumen menu/Xa81kLm
   {
   "nama": "Nasi Ayam Bakar",
   "harga": 25000,
   "sisa_porsi": 30,
   "tersedia": true,
   "dibuat_pada": 1 Oktober 2026 07.00
   }
4. Koleksi pelanggan
   Menyimpan data pelanggan dan alamat pengiriman. ID dokumen memakai nomor WhatsApp, sehingga satu nomor hanya dapat dipakai satu pelanggan.
   Field
   Tipe
   Wajib
   Keterangan
   nama
   string
   Ya
   Nama pelanggan, 1 sampai 60 karakter
   no_whatsapp
   string
   Ya
   Sama dengan ID dokumen. Diawali 08, total 10 sampai 13 angka
   alamat
   string
   Ya
   Alamat pengiriman, 1 sampai 200 karakter
   dibuat_pada
   timestamp
   Ya
   Waktu dokumen dibuat
   Contoh dokumen pelanggan/081234567890
   {
   "nama": "Budi Santoso",
   "no_whatsapp": "081234567890",
   "alamat": "Jl. Melati No. 12, RT 03/RW 05",
   "dibuat_pada": 1 Oktober 2026 07.15
   }
   Nomor WhatsApp disimpan sebagai teks (string), bukan angka, supaya angka 0 di depan tidak hilang.
5. Koleksi pesanan
   Menyimpan pesanan dari pelanggan. ID dokumen dibuat otomatis. Untuk latihan, satu pesanan hanya berisi satu menu.
   Field
   Tipe
   Wajib
   Keterangan
   pelanggan_id
   string
   Ya
   ID dokumen pelanggan (nomor WhatsApp)
   nama_pelanggan
   string
   Ya
   Salinan nama pelanggan saat memesan
   alamat_kirim
   string
   Ya
   Salinan alamat saat memesan
   menu_id
   string
   Ya
   ID dokumen menu yang dipesan
   nama_menu
   string
   Ya
   Salinan nama menu saat memesan
   harga_satuan
   number (bulat)
   Ya
   Harga menu saat memesan
   jumlah_porsi
   number (bulat)
   Ya
   Minimal 1 dan tidak melebihi sisa porsi menu
   ongkir
   number (bulat)
   Ya
   Ongkos kirim, minimal 0
   total
   number (bulat)
   Ya
   harga_satuan × jumlah_porsi + ongkir
   status
   string
   Ya
   Salah satu nilai pada tabel status di bawah
   bukti_bayar
   string
   Tidak
   Tautan gambar atau catatan transfer. Boleh kosong
   tanggal
   string
   Ya
   Tanggal pesanan, format YYYY-MM-DD
   dibuat_pada
   timestamp
   Ya
   Waktu dokumen dibuat
   Mengapa nama dan harga disalin?
   Jika harga menu berubah besok, pesanan hari ini tetap menyimpan harga saat memesan. Laporan hari sebelumnya tidak ikut berubah.
   Nilai field status
   Nilai
   Arti
   Boleh berubah ke
   menunggu_bayar
   Pesanan baru, belum dibayar
   dibayar atau dibatalkan
   dibayar
   Bukti bayar sudah diterima
   diproses atau dibatalkan
   diproses
   Pesanan disiapkan atau dikirim
   selesai
   selesai
   Pesanan sudah diterima pelanggan
   Tidak ada
   dibatalkan
   Pesanan batal, tidak dihitung di laporan
   Tidak ada
   Pesanan baru selalu dimulai dari menunggu_bayar. Status tidak boleh melompat atau mundur.
   Contoh dokumen pesanan/Pq72nRt
   {
   "pelanggan_id": "081234567890",
   "nama_pelanggan": "Budi Santoso",
   "alamat_kirim": "Jl. Melati No. 12, RT 03/RW 05",
   "menu_id": "Xa81kLm",
   "nama_menu": "Nasi Ayam Bakar",
   "harga_satuan": 25000,
   "jumlah_porsi": 2,
   "ongkir": 5000,
   "total": 55000,
   "status": "menunggu_bayar",
   "bukti_bayar": "",
   "tanggal": "2026-10-01",
   "dibuat_pada": 1 Oktober 2026 08.30
   }
   Perhitungan total: 25.000 × 2 + 5.000 = 55.000.
6. Tiga Aturan Nilai
   Tiga aturan ini harus selalu benar pada data. Aturan ini nanti dijaga oleh formulir dan security rules.
   No
   Aturan
   Koleksi
   1
   harga dan sisa_porsi tidak pernah bernilai negatif
   menu
   2
   jumlah_porsi minimal 1 dan tidak melebihi sisa_porsi menu
   pesanan
   3
   total selalu sama dengan harga_satuan × jumlah_porsi + ongkir
   pesanan
7. Arti Tipe Data
   Tipe
   Arti
   Contoh
   string
   Teks
   "Rendang"
   number
   Angka
   35000
   boolean
   Pilihan ya atau tidak
   true / false
   timestamp
   Tanggal dan jam
   1 Oktober 2026 07.00
