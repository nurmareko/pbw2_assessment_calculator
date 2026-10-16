(function (root) {
  const sections = [
    { title: 'Setup proyek & basis data', weight: 25, items: [
      ['1A', 'Setup Laravel', 6, 'Dependensi, .env, application key, database telu_pharmacy; .env tidak di-commit.', 'Jelaskan urutan setup dari repository kosong. Apa fungsi APP_KEY dan mengapa .env tidak di-commit?'],
      ['1B', 'Migration & relasi Eloquent', 7, 'Migration dan model medicines/prescriptions; name unique, foreign key, hasMany dan belongsTo.', 'Tunjukkan foreign key dan kedua method relasi. Mengapa migration medicines harus lebih dulu?'],
      ['1C', 'Role pengguna', 6, 'Migration baru menambahkan role pada users; role terdaftar di fillable.', 'Mengapa menambah role melalui migration baru? Apa fungsi fillable pada User?'],
      ['1D', 'Seeder', 6, 'Dua akun admin/operator yang ditentukan, contoh obat dan resep; dipanggil dari DatabaseSeeder.', 'Tunjukkan pemanggilan seeder, akun kedua peran, dan bagaimana contoh resep merujuk obat.']
    ] },
    { title: 'Autentikasi & hak akses', weight: 25, items: [
      ['2A', 'Login manual', 7, 'GET/POST /login, validasi email/password, pesan kredensial salah, redirect ke daftar obat.', 'Telusuri proses dari form login sampai pengguna terautentikasi. Bagaimana kredensial salah ditangani?'],
      ['2B', 'Logout & bar pengguna', 5, 'POST /logout, nama/peran/tombol Keluar pada layout induk, redirect ke login.', 'Tunjukkan asal nama dan role di layout. Apa yang dilakukan kode logout terhadap sesi?'],
      ['2C', 'Proteksi halaman data', 6, 'Root menuju /medicines; seluruh halaman data mengalihkan tamu ke /login.', 'Tunjukkan middleware halaman data. Apa yang terjadi jika tamu mengetik URL edit secara langsung?'],
      ['2D', 'Gate & halaman 403', 7, 'Gate kelola-obat/kelola-resep khusus admin, @can, penjagaan server, halaman 403 khusus.', 'Mengapa @can saja tidak cukup? Tunjukkan pemeriksaan server dan lokasi view 403.']
    ] },
    { title: 'Manajemen obat', weight: 35, items: [
      ['3A', 'Daftar obat', 8, 'GET /medicines, tabel seluruh obat, aksi admin saja, pesan saat data kosong.', 'Telusuri data dari route ke controller dan Blade. Bagaimana kondisi kosong dan tombol admin ditangani?'],
      ['3B', 'Tambah obat', 8, 'GET /medicines/create, POST /medicines; name/category/price/stock, simpan dan redirect.', 'Tunjukkan alur submit, penyimpanan model, dan redirect. Apa perbedaan route GET dan POST di sini?'],
      ['3C', 'Validasi form', 7, 'name wajib/unique; category wajib; price numeric ≥ 0; stock integer ≥ 0; pesan per field dan old().', 'Jelaskan aturan price dan stock. Bagaimana pesan kesalahan dan nilai input lama ditampilkan?'],
      ['3D', 'Ubah obat', 7, 'GET edit dan PUT update; nilai lama terisi; unique mengabaikan baris yang diedit.', 'Mengapa unique harus mengabaikan ID saat update? Bagaimana form mengirim request PUT?'],
      ['3E', 'Detail & hapus obat', 5, 'GET detail, DELETE hapus, redirect/pesan sukses; ID tidak ditemukan menghasilkan 404.', 'Tunjukkan detail, hapus, dan penanganan ID yang tidak ada. Mengapa menghasilkan 404?']
    ] },
    { title: 'Penebusan resep', weight: 15, items: [
      ['4A', 'Daftar penebusan', 5, 'GET /prescriptions; nama obat diambil melalui relasi, bukan diduplikasi.', 'Bagaimana nama obat ditampilkan dari relasi? Mengapa tidak disimpan ulang pada prescriptions?'],
      ['4B', 'Tambah & hitung total', 7, 'GET create/POST prescriptions; customer_name wajib, medicine_id exists, quantity integer ≥ 1; total di controller.', 'Tunjukkan validasi dan perhitungan price × quantity. Mengapa total tidak boleh dipercaya dari form?'],
      ['4C', 'Hak akses resep', 3, 'Operator boleh melihat daftar, tidak boleh menambah; tombol tersembunyi dan route dijaga.', 'Apa hasilnya jika operator mengirim POST langsung? Tunjukkan kode yang menolaknya.']
    ] }
  ];
  const levels = ['Belum paham', 'Paham sebagian', 'Paham menyeluruh'];
  function calculate(ratings) {
    let total = 0, assessed = 0, covered = 0;
    const groups = sections.map(section => {
      let score = 0;
      for (const [id, , weight] of section.items) {
        const rating = ratings[id];
        if (Number.isInteger(rating) && rating >= 0 && rating <= 2) {
          score += weight * rating / 2; assessed++; covered += weight;
        }
      }
      total += score;
      return score;
    });
    return { total, assessed, covered, groups, complete: assessed === 16 };
  }
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toMarkdown({ name = '', nim = '', ratings = {} }) {
    const escape = value => String(value).replace(/[\r\n]+/g, ' ')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/[\\`*_{}\[\]()#+.!|~-]/g, '\\$&');
    const format = value => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    const result = calculate(ratings);
    const lines = [
      '# Nilai responsi PBW2', '', 'Assessment 1 · Kode D', '',
      `Nama: ${escape(name) || '—'}`, '', `NIM: ${escape(nim) || '—'}`, '',
      `Status: ${result.complete ? 'Lengkap' : 'Sementara'} (${result.assessed}/16 dinilai)`, '',
      '| Butir | Komponen | Bobot | Pemahaman (0–2) | Poin |',
      '| --- | --- | ---: | --- | ---: |'
    ];
    for (const section of sections) {
      for (const [id, title, weight] of section.items) {
        const rating = ratings[id];
        const assessed = Number.isInteger(rating) && rating >= 0 && rating <= 2;
        lines.push(`| ${id} | ${escape(title)} | ${weight} | ${assessed ? `${rating} — ${levels[rating]}` : 'Belum dinilai'} | ${assessed ? format(weight * rating / 2) : '—'} |`);
      }
    }
    lines.push('', `**Total: ${format(result.total)} / 100**`, '',
      'Poin = bobot × pemahaman ÷ 2. Skala 0–2 adalah usulan responsi, bukan formula resmi nilai akhir.', '');
    return lines.join('\n');
  }
  const api = { sections, levels, calculate, csvCell, toMarkdown };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Rubric = api;
})(globalThis);
