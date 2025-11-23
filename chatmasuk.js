(function(){
  let rows = document.querySelectorAll('[aria-label="Daftar chat"][role="grid"] div[role="row"]');
  let results = [];
  rows.forEach(row => {
    // cari badge angka unread (misalnya 6, 3, dst)
    let badge = Array.from(row.querySelectorAll('span')).find(sp => /^\d+$/.test(sp.innerText.trim()));
    if (!badge) return;

    let sender = row.querySelector('span[title]')?.getAttribute('title');
    let message = row.querySelector('span[dir="ltr"]')?.innerText;
    let time = row.querySelector('div._ak8i')?.innerText;

    if (sender && message) {
      results.push(sender + '|' + message + '|' + (time || ''));
    }
  });
  return results.join('|||');
})();
