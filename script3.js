const plus      = document.getElementById("plus");
const minus     = document.getElementById("minus");
const read      = document.getElementById("read");
const write     = document.getElementById("write");
const readMode  = document.getElementById("read_mode");
const writeMode = document.getElementById("write_mode");
const update    = document.getElementById("update");
const reload    = document.getElementById("reload");
const username  = document.getElementById("username");
let size = 20;

// ─── Load kuromoji from CDN ───────────────────────────────────────────────────
// kuromoji.js tokenizes Japanese text into real words in the browser.
// Dict files are loaded from cdn.jsdelivr.net (no server needed).

let tokenizerReady = false;
let kuromoji_tokenizer = null;

function loadKuromoji() {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js";
        script.onload = () => {
            kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" })
                .build((err, tokenizer) => {
                    if (!err) {
                        kuromoji_tokenizer = tokenizer;
                        tokenizerReady = true;
                    }
                    resolve();
                });
        };
        document.head.appendChild(script);
    });
}

loadKuromoji();

// ─── Tokenize and wrap text ───────────────────────────────────────────────────

function isJapanese(ch) {
    const c = ch.codePointAt(0);
    return (
        (c >= 0x3040 && c <= 0x309f) ||
        (c >= 0x30a0 && c <= 0x30ff) ||
        (c >= 0x4e00 && c <= 0x9fff) ||
        (c >= 0x3400 && c <= 0x4dbf)
    );
}

function containsJapanese(str) {
    return [...str].some(isJapanese);
}

// Wrap text using kuromoji tokens if available, otherwise char-by-char fallback
function buildHtml(text) {
    if (!tokenizerReady || !kuromoji_tokenizer) {
        // Fallback: each JP char is its own word span
        let html = "";
        for (const ch of text) {
            if (ch === "\n") html += "<br>";
            else if (isJapanese(ch)) html += `<span class="jp-word" data-word="${ch}" style="cursor:pointer;border-bottom:1px dashed #7878c8">${ch}</span>`;
            else html += ch.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        }
        return html;
    }

    // Split by newlines first, tokenize each line
    const lines = text.split("\n");
    return lines.map(line => {
        if (!line) return "";
        const tokens = kuromoji_tokenizer.tokenize(line);
        return tokens.map(token => {
            const surface = token.surface_form;
            if (containsJapanese(surface)) {
                const escaped = surface.replace(/"/g, "&quot;");
                return `<span class="jp-word" data-word="${escaped}" style="cursor:pointer;border-bottom:1px dashed #7878c8;transition:background 0.1s" onmouseover="this.style.background='rgba(120,120,200,0.15)'" onmouseout="this.style.background=''">${surface}</span>`;
            }
            return surface.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        }).join("");
    }).join("<br>");
}

function refreshReadPanel(text) {
    read.innerHTML = buildHtml(text);
}

// Re-render once kuromoji finishes loading (if text is already displayed)
const _origLoad = loadKuromoji;
// Poll until tokenizer ready and re-render if content exists
const _pollRender = setInterval(() => {
    if (tokenizerReady && read.textContent.trim()) {
        refreshReadPanel(write.value);
        clearInterval(_pollRender);
    }
}, 300);

// ─── Popup ────────────────────────────────────────────────────────────────────

const popup = document.createElement("div");
popup.id = "jp-popup";

document.body.appendChild(popup);

function showPopup(x, y, html) {
    popup.innerHTML = html;
    popup.style.display = "block";
    const pw   = 290;
    const left = (x + pw + 20 > window.innerWidth) ? x - pw - 10 : x + 12;
    const top  = Math.min(y - 10, window.innerHeight - 220);
    popup.style.left = left + "px";
    popup.style.top  = top  + "px";
}

function hidePopup() { popup.style.display = "none"; }

// ─── Jisho lookup via PHP proxy ───────────────────────────────────────────────

async function lookupWord(word) {
    console.log(`La palabra es: ${word}`)
    try {
        const res  = await fetch(`jisho_proxy.php?word=${encodeURIComponent(word)}`);
        
        const data = await res.json();
        
        return data?.data?.[0] || null;
    } catch (e) {
        console.error("Jisho lookup error:", e);
        return null;
    }
}

// ─── Click on Japanese word ───────────────────────────────────────────────────

read.addEventListener("click", async (e) => {
    const span = e.target.closest(".jp-word");
    if (!span) { hidePopup(); return; }

    const word = span.dataset.word || span.textContent.trim();
    if (!word) return;

    showPopup(e.clientX, e.clientY,
        `<div style="color:#000000;font-size:13px">🔍 Buscando <strong style="color:#000000">${word}</strong>…</div>`);

    const result = await lookupWord(word);

    if (!result) {
        showPopup(e.clientX, e.clientY,
            `<div style="color:#000000">No se encontró: <strong>${word}</strong></div>`);
        return;
    }

    const jp      = result.japanese?.[0] || {};
    const reading = jp.reading || "—";
    const form    = jp.word    || word;
    const senses  = result.senses?.slice(0, 3) || [];

    const meaningsHtml = senses.map((s, i) => {
        const defs = s.english_definitions?.slice(0, 3).join(", ") || "";
        const pos  = s.parts_of_speech?.join(", ") || "";
        return `
            <div style="margin-top:6px;padding-top:6px;${i > 0 ? "border-top:1px solid #333;" : ""}">
                ${pos ? `<div style="color:#000000;font-size:17px;text-transform:uppercase;letter-spacing:.05em">${pos}</div>` : ""}
                <div style="color:#000000">${defs}</div>
            </div>`;
    }).join("");

    showPopup(e.clientX, e.clientY, `
        <div style="font-size:27px;font-weight:bold;color:#000000;font-family:'Noto Sans JP',sans-serif">${form}</div>
        <div style="color:#000000;font-size:20px;margin-bottom:4px;font-family:'Noto Sans JP',sans-serif">【${reading}】</div>
        <hr style="border:none;border-top:1px solid #333;margin:6px 0">
        ${meaningsHtml}
        <div style="margin-top:8px;font-size:18px;color:#000000;text-align:right">via Jisho.org</div>
    `);
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".jp-word") && !e.target.closest("#jp-popup")) hidePopup();
});

// ─── Original functionality ───────────────────────────────────────────────────

update.addEventListener('click', () => {
    fetch('update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: write.value, username: username.value })
    }).then(res => res.text()).then(data => console.log(data));
});

reload.addEventListener('click', () => {
    fetch('reload.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value })
    })
    .then(res => res.json())
    .then(data => {
        write.value = data.text;
        refreshReadPanel(data.text);
    });
});

write.addEventListener('input', () => refreshReadPanel(write.value));

read.style.fontSize = size + "px";

readMode.addEventListener('click', () => {
    read.style.display  = "block";
    write.style.display = "none";
});
writeMode.addEventListener('click', () => {
    read.style.display  = "none";
    write.style.display = "block";
});

plus.addEventListener('click',  () => { size += 3; read.style.fontSize = size + "px"; });
minus.addEventListener('click', () => { size -= 3; read.style.fontSize = size + "px"; });