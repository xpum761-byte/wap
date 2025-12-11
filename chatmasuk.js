// chatmasuk.js
(function() {
    let rows = document.querySelectorAll('div[role="row"]'); 
    let results = [];

    rows.forEach(row => {
        // syarat utama: harus ada bubble unread
        let badge = row.querySelector('span.xyp3urf, span.x140p0ai');
        if (!badge) return; // kalau tidak ada, skip row

        let sender = row.querySelector('span[title]')?.getAttribute('title');
        let messageNode = row.querySelector('span[dir="ltr"]');
        let message = messageNode?.innerText;  
        let time = row.querySelector('div._ak8i')?.innerText;

        if (sender && message) {
            results.push(sender + '|' + message + '|' + (time || ''));
        }
    });

    return results.join('|||');
})();
