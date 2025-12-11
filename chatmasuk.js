// ==========================
// Inbox capture: pesan masuk saja
// ==========================

// Array untuk menyimpan pesan masuk
const INBOX = [];

// Fungsi ambil semua pesan masuk yang sudah ada di thread aktif
function getIncomingMessages() {
  const results = [];
  // selector untuk bubble pesan masuk (biasanya ada atribut data-id dan data-arg=in)
  const bubbles = document.querySelectorAll("div[data-id*='msg'][data-arg*='in']");
  bubbles.forEach(bubble => {
    const text = bubble.textContent?.trim();
    if (text) {
      const sender = bubble.getAttribute("data-author") || "unknown";
      const time = bubble.querySelector("span[aria-label]")?.getAttribute("aria-label") || "";
      const msgId = bubble.getAttribute("data-id") || "";
      results.push({ id: msgId, sender, text, time });
    }
  });
  return results;
}

// Fungsi untuk mulai observasi pesan baru masuk
function observeIncoming() {
  const container = document.querySelector("#app");
  if (!container) {
    console.warn("Container WhatsApp tidak ditemukan.");
    return;
  }

  const obs = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        const inbound = node.querySelector?.("div[data-id*='msg'][data-arg*='in']");
        if (inbound) {
          const text = inbound.textContent?.trim() || "";
          const sender = inbound.getAttribute("data-author") || "unknown";
          const time = inbound.querySelector("span[aria-label]")?.getAttribute("aria-label") || "";
          const msgId = inbound.getAttribute("data-id") || "";
          if (text) {
            const msg = { ts: Date.now(), id: msgId, sender, text, time };
            INBOX.push(msg);
            console.log("Pesan masuk:", msg);
            // Simpan ke storage agar tetap ada meski WA logout
            chrome.storage.local.set({ INBOX }).catch(() => {});
          }
        }
      });
    });
  });

  obs.observe(container, { childList: true, subtree: true });
}

// ==========================
// Jalankan observer
// ==========================
observeIncoming();

// ==========================
// Contoh ambil semua pesan masuk yang sudah ada
// ==========================
console.log(getIncomingMessages());
