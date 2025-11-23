"
let rows = document.querySelectorAll('[aria-label=""Daftar chat""][role=""grid""] div[role=""row""]'); // ambil semua row chat di daftar
let results = [];
rows.forEach(row => {
    // cari badge angka unread (misalnya 6, 3, dst)
    let badge = row.querySelector('span.x140p0ai0'); 
    if (!badge) return; // kalau tidak ada badge, berarti tidak ada pesan baru

    let count = badge.innerText;
    if (!count || isNaN(count)) return; // pastikan badge berisi angka

    // ambil nama pengirim (title di span)
    let sender = row.querySelector('span[title]')?.getAttribute('title');
    // ambil preview pesan terakhir
    let message = row.querySelector('span[dir=""ltr""]')?.innerText;  
    // ambil waktu pesan terakhir
    let time = row.querySelector('div._ak8i')?.innerText;

    // kalau ada data valid, simpan ke results
    if (sender && message) {
        results.push(sender + '|' + message + '|' + (time || ''));
    }
});
return results.join('|||'); // gabungkan semua hasil jadi satu string dengan delimiter |||
"
