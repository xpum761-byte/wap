(function() {
  const MyWAPI = {
    _linked: {},
    _listeners: { message: null, status: null },

    // =========================
    // Helpers umum
    // =========================
    _log: function(...args) { console.log("[MyWAPI]", ...args); },
    _err: function(...args) { console.error("[MyWAPI]", ...args); },

    _ensureReady: function() {
      const ready = document.querySelector("div[data-testid='chat-list']") !== null;
      if (!ready) this._log("UI belum siap atau belum login.");
      return ready;
    },

    _findElement: function(sel) { return document.querySelector(sel); },

    _typeIntoComposer: function(text) {
      const box = document.querySelector("[contenteditable='true']");
      if (!box) throw new Error("Composer not found");
      box.focus();
      document.execCommand("insertText", false, text);
    },

    _clickSend: function() {
      const btn = document.querySelector("span[data-icon='send']");
      if (btn) btn.click();
    },

    // =========================
    // Status & akun
    // =========================
    isReady: function() {
      return this._ensureReady() && document.querySelector("canvas[aria-label='Scan me!']") === null;
    },

    getMe: function() {
      const u = this._linked.getMe;
      if (u) {
        try { return u(); } catch(e) { this._err("getMe internal error:", e); }
      }
      // Fallback sangat terbatas
      try {
        const nameEl = document.querySelector("header div[role='button'] span[title]");
        const name = nameEl ? nameEl.getAttribute("title") : "";
        return { id: null, pushname: name, wid: null };
      } catch (e) {
        return { id: null, pushname: "", wid: null };
      }
    },

    // =========================
    // Pesan & chat
    // =========================
    sendMessage: async function(chatId, message) {
  try {
    if (this._sendMessageFn) {
      const msg = await this._sendMessageFn(chatId, { text: message });
      // msg biasanya punya status / ack
      return {
        id: msg.id?._serialized || null,
        body: msg.body || message,
        status: msg.status || "pending" // 0=pending,1=sent,2=delivered,3=read,-1=failed
      };
    }

    // ⚠️ Fallback DOM injection
    this._typeIntoComposer(message);
    this._clickSend();
    return { id: null, body: message, status: "sent" };
  } catch (err) {
    console.error("❌ MyWAPI.sendMessage failed:", err);
    return { id: null, body: message, status: "failed" };
  }
}
    sendFile: async function(chatId, base64Data, filename = "file") {
      const fn = this._linked.sendFile || this._linked.sendMediaMessage;
      try {
        if (!fn) throw new Error("sendFile internal not available");
        return await fn(chatId, base64Data, filename);
      } catch (e) {
        this._err("sendFile error:", e);
        return false;
      }
    },

    getChats: function() {
      const fn = this._linked.getChats || this._linked.ChatCollection || this._linked.queryChats;
      try {
        if (fn) {
          const res = typeof fn === "function" ? fn() : (fn.getAll ? fn.getAll() : []);
          return Array.isArray(res) ? res : [];
        }
        // Fallback DOM
        const chats = [];
        document.querySelectorAll("div[role='row']").forEach(row => {
          const title = row.innerText.split("\n")[0];
          if (title) chats.push({ id: null, name: title, unread: null });
        });
        return chats;
      } catch (e) {
        this._err("getChats error:", e);
        return [];
      }
    },

    getChatById: function(chatId) {
      const fn = this._linked.getChatById || this._linked.getChat || this._linked.ChatStore?.get;
      try {
        if (fn) {
          if (typeof fn === "function") return fn(chatId);
          if (typeof fn === "object" && fn.get) return fn.get(chatId);
        }
        return null;
      } catch (e) {
        this._err("getChatById error:", e);
        return null;
      }
    },

    getMessages: function(chatId, opts = { limit: 50, direction: "backward" }) {
      const fn = this._linked.getMessages || this._linked.MsgStore?.getMessages;
      try {
        if (fn) return fn(chatId, opts);
        // Fallback DOM: hanya chat aktif
        const msgs = [];
        document.querySelectorAll("div.message-in, div.message-out").forEach(el => {
          const text = el.innerText?.trim();
          if (text) msgs.push({ body: text, type: el.classList.contains("message-in") ? "in" : "out" });
        });
        return msgs.slice(-opts.limit);
      } catch (e) {
        this._err("getMessages error:", e);
        return [];
      }
    },

    markRead: async function(chatId) {
      const fn = this._linked.sendSeen || this._linked.markSeen || this._linked.markRead;
      try {
        if (!fn) throw new Error("markRead internal not available");
        return await fn(chatId);
      } catch (e) {
        this._err("markRead error:", e);
        return false;
      }
    },

    pinChat: async function(chatId) {
      const fn = this._linked.pinChat || this._linked.pin;
      try {
        if (!fn) throw new Error("pinChat internal not available");
        return await fn(chatId, true);
      } catch (e) {
        this._err("pinChat error:", e);
        return false;
      }
    },

    unpinChat: async function(chatId) {
      const fn = this._linked.pinChat || this._linked.pin;
      try {
        if (!fn) throw new Error("unpinChat internal not available");
        return await fn(chatId, false);
      } catch (e) {
        this._err("unpinChat error:", e);
        return false;
      }
    },

    archiveChat: async function(chatId) {
      const fn = this._linked.archiveChat || this._linked.archive;
      try {
        if (!fn) throw new Error("archiveChat internal not available");
        return await fn(chatId, true);
      } catch (e) {
        this._err("archiveChat error:", e);
        return false;
      }
    },

    unarchiveChat: async function(chatId) {
      const fn = this._linked.archiveChat || this._linked.archive;
      try {
        if (!fn) throw new Error("unarchiveChat internal not available");
        return await fn(chatId, false);
      } catch (e) {
        this._err("unarchiveChat error:", e);
        return false;
      }
    },

    // =========================
    // Kontak & profil
    // =========================
    getContacts: function() {
      const fn = this._linked.getContacts || this._linked.ContactCollection || this._linked.queryContacts;
      try {
        if (fn) {
          const res = typeof fn === "function" ? fn() : (fn.getAll ? fn.getAll() : []);
          return Array.isArray(res) ? res : [];
        }
        // Fallback DOM
        const list = [];
        document.querySelectorAll("div[role='row']").forEach(row => {
          const title = row.innerText.split("\n")[0];
          if (title) list.push({ id: null, name: title });
        });
        return list;
      } catch (e) {
        this._err("getContacts error:", e);
        return [];
      }
    },

    getProfilePic: async function(chatId) {
      const fn = this._linked.getProfilePicUrl || this._linked.getProfilePic || this._linked.ProfilePicThumb?.get;
      try {
        if (fn) {
          if (typeof fn === "function") return await fn(chatId);
          if (typeof fn === "object" && fn.get) return await fn.get(chatId);
        }
        return null;
      } catch (e) {
        this._err("getProfilePic error:", e);
        return null;
      }
    },

    setStatus: async function(text) {
      const fn = this._linked.setStatus || this._linked.setAbout || this._linked.Profile?.setAbout;
      try {
        if (!fn) throw new Error("setStatus internal not available");
        return await fn(text);
      } catch (e) {
        this._err("setStatus error:", e);
        return false;
      }
    },

    // =========================
    // Group management
    // =========================
    createGroup: async function(subject, participants = []) {
      const fn = this._linked.createGroup || this._linked.Group?.create;
      try {
        if (!fn) throw new Error("createGroup internal not available");
        return await fn(subject, participants);
      } catch (e) {
        this._err("createGroup error:", e);
        return null;
      }
    },

    getGroupParticipants: function(groupId) {
      const fn = this._linked.getGroupParticipants || this._linked.GroupMetadata?.getParticipants;
      try {
        if (fn) return fn(groupId);
        return [];
      } catch (e) {
        this._err("getGroupParticipants error:", e);
        return [];
      }
    },

    addParticipant: async function(groupId, participantId) {
      const fn = this._linked.addParticipant || this._linked.GroupParticipants?.add;
      try {
        if (!fn) throw new Error("addParticipant internal not available");
        return await fn(groupId, participantId);
      } catch (e) {
        this._err("addParticipant error:", e);
        return false;
      }
    },

    removeParticipant: async function(groupId, participantId) {
      const fn = this._linked.removeParticipant || this._linked.GroupParticipants?.remove;
      try {
        if (!fn) throw new Error("removeParticipant internal not available");
        return await fn(groupId, participantId);
      } catch (e) {
        this._err("removeParticipant error:", e);
        return false;
      }
    },

    promoteAdmin: async function(groupId, participantId) {
      const fn = this._linked.promoteParticipant || this._linked.GroupParticipants?.promote;
      try {
        if (!fn) throw new Error("promoteAdmin internal not available");
        return await fn(groupId, participantId);
      } catch (e) {
        this._err("promoteAdmin error:", e);
        return false;
      }
    },

    demoteAdmin: async function(groupId, participantId) {
      const fn = this._linked.demoteParticipant || this._linked.GroupParticipants?.demote;
      try {
        if (!fn) throw new Error("demoteAdmin internal not available");
        return await fn(groupId, participantId);
      } catch (e) {
        this._err("demoteAdmin error:", e);
        return false;
      }
    },

    // =========================
    // Kontrol kontak (block/unblock)
    // =========================
    blockContact: async function(contactId) {
      const fn = this._linked.blockContact || this._linked.Blocklist?.block;
      try {
        if (!fn) throw new Error("blockContact internal not available");
        return await fn(contactId);
      } catch (e) {
        this._err("blockContact error:", e);
        return false;
      }
    },

    unblockContact: async function(contactId) {
      const fn = this._linked.unblockContact || this._linked.Blocklist?.unblock;
      try {
        if (!fn) throw new Error("unblockContact internal not available");
        return await fn(contactId);
      } catch (e) {
        this._err("unblockContact error:", e);
        return false;
      }
    },

    // =========================
    // Listener (real-time)
    // =========================
    onMessage: function(callback) {
      this._listeners.message = callback;
      const ev = this._linked.MsgEvent || this._linked.onIncomingMsg || this._linked.EventEmitter;
      try {
        if (ev && ev.on) {
          ev.on("message", msg => { try { callback(msg); } catch(e){} });
          this._log("onMessage linked to internal emitter.");
        } else {
          // Fallback: MutationObserver di panel pesan (lebih berat)
          const panel = document.querySelector("div[role='grid']");
          if (!panel) return this._log("onMessage fallback: panel not found");
          const obs = new MutationObserver(() => {
            const last = document.querySelector("div.message-in:last-of-type");
            if (last) {
              const text = last.innerText?.trim();
              if (text) callback({ body: text, fromMe: false });
            }
          });
          obs.observe(panel, { childList: true, subtree: true });
          this._log("onMessage fallback observer aktif.");
        }
      } catch (e) {
        this._err("onMessage error:", e);
      }
    },

    onStatus: function(callback) {
      this._listeners.status = callback;
      // Placeholder: bergantung internal EventEmitter/status modules
      const ev = this._linked.StatusEvent || this._linked.EventEmitter;
      try {
        if (ev && ev.on) {
          ev.on("status", s => { try { callback(s); } catch(e){} });
          this._log("onStatus linked to internal emitter.");
        } else {
          this._log("onStatus internal emitter not available.");
        }
      } catch (e) {
        this._err("onStatus error:", e);
      }
    },

    // =========================
    // Auto-detect modul internal
    // =========================
    autoDetect: function() {
      const chunk = window.webpackChunkwhatsapp_web_client;
      if (!chunk) return this._log("webpackChunkwhatsapp_web_client not found.");

      const origPush = chunk.push.bind(chunk);
      const wanted = [
        "sendmessage","sendseen","markseen","markread","pinchat","archivechat","sendmediamessage",
        "getchats","getchatbyid","chatstore","chatcollection","querychats",
        "getcontacts","contactcollection","querycontacts",
        "getmessages","msgstore",
        "getprofilepicurl","profilepicthumb","setstatus","setabout",
        "creategroup","group","groupmetadata","groupparticipants","addparticipant","removeparticipant","promoteparticipant","demoteparticipant",
        "blockcontact","blocklist",
        "eventemitter","onincomingmsg","msgevent","statusevent","getme"
      ];

      chunk.push = (args) => {
        const res = origPush(args);
        try {
          const o = args[2];
          for (let id in o.c) {
            const exp = o.c[id]?.exports;
            if (!exp || typeof exp !== "object") continue;

            Object.keys(exp).forEach(fn => {
              const lower = fn.toLowerCase();
              if (wanted.some(k => lower.includes(k))) {
                // Link beberapa nama ke registry
                if (lower.includes("sendmessage")) this._linked.sendMessage = exp[fn];
                else if (lower.includes("sendseen") || lower.includes("markseen") || lower.includes("markread")) this._linked.markRead = exp[fn];
                else if (lower.includes("pinchat") || lower === "pin") this._linked.pinChat = exp[fn];
                else if (lower.includes("archivechat") || lower === "archive") this._linked.archiveChat = exp[fn];
                else if (lower.includes("sendmediamessage") || lower.includes("sendfile")) this._linked.sendFile = exp[fn];

                else if (lower.includes("getchats") || lower.includes("chatcollection") || lower.includes("querychats")) this._linked.getChats = exp[fn];
                else if (lower.includes("getchatbyid") || lower.includes("getchat")) this._linked.getChatById = exp[fn];
                else if (lower.includes("chatstore")) this._linked.ChatStore = exp[fn];

                else if (lower.includes("getcontacts") || lower.includes("contactcollection") || lower.includes("querycontacts")) this._linked.getContacts = exp[fn];

                else if (lower.includes("getmessages") || lower.includes("msgstore")) this._linked.getMessages = exp[fn];

                else if (lower.includes("getprofilepicurl") || lower.includes("profilepicthumb")) this._linked.getProfilePicUrl = exp[fn];

                else if (lower.includes("setstatus") || lower.includes("setabout")) this._linked.setStatus = exp[fn];

                else if (lower.includes("creategroup")) this._linked.createGroup = exp[fn];
                else if (lower.includes("groupmetadata")) this._linked.GroupMetadata = exp[fn];
                else if (lower.includes("groupparticipants")) this._linked.GroupParticipants = exp[fn];
                else if (lower.includes("addparticipant")) this._linked.addParticipant = exp[fn];
                else if (lower.includes("removeparticipant")) this._linked.removeParticipant = exp[fn];
                else if (lower.includes("promoteparticipant")) this._linked.promoteParticipant = exp[fn];
                else if (lower.includes("demoteparticipant")) this._linked.demoteParticipant = exp[fn];
                else if (lower.includes("getgroupparticipants")) this._linked.getGroupParticipants = exp[fn];

                else if (lower.includes("blockcontact") || lower.includes("blocklist")) this._linked.blockContact = exp[fn];
                else if (lower.includes("unblock")) this._linked.unblockContact = exp[fn];

                else if (lower.includes("eventemitter")) this._linked.EventEmitter = exp[fn];
                else if (lower.includes("onincomingmsg") || lower.includes("msgevent")) this._linked.MsgEvent = exp[fn];
                else if (lower.includes("statusevent")) this._linked.StatusEvent = exp[fn];

                else if (lower.includes("getme") || lower.includes("me")) this._linked.getMe = exp[fn];

                this._log("✅ Linked", id, fn);
              }
            });
          }
        } catch (e) { /* swallow */ }
        return res;
      };

      this._log("🔎 AutoDetect aktif. Refresh WhatsApp Web untuk memuat modul.");
    }
  };

  window.MyWAPI = MyWAPI;
  MyWAPI.autoDetect();
})();
