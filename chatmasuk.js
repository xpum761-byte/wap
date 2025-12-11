// chatmasuk.js
(function() {
    let rows = document.querySelectorAll('div[role="row"]'); 
    let results = [];

    rows.forEach(row => {
        let badge = row.querySelector('span.xyp3urf, span.x140p0ai');
        if (!badge) return;

        let sender = row.querySelector('span[title]')?.getAttribute('title');
        let messageNode = row.querySelector('span[dir="ltr"]');
        let message = messageNode?.innerText;  
        let time = row.querySelector('div._ak8i')?.innerText;

        if (sender && message) {
            results.push(sender + '|' + message + '|' + (time || ''));
        }
    });

    return results.length > 0 ? results.join('|||') : "NONE";
})();
