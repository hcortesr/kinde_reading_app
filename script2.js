const plus = document.getElementById("plus");
const minus = document.getElementById("minus");
const read = document.getElementById("read");
const write = document.getElementById("write");
const readMode = document.getElementById("read_mode");
const writeMode = document.getElementById("write_mode");
const update = document.getElementById("update");
const reload = document.getElementById("reload");
const username = document.getElementById("username");
let size = 20;

// ─── Japanese Lookup Popup ───────────────────────────────────────────────────

// Create popup element
const popup = document.createElement("div");
popup.id = "jp-popup";
popup.style.cssText = `
  display: none;
  position: fixed;
  z-index: 9999;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 1px solid #4a4a8a;
  border-radius: 10px;
  padding: 14px 18px;
  max-width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  pointer-events: none;
`;
document.body.appendChild(popup);

// Detect if a character is Japanese (kanji, hiragana, katakana)
function isJapanese(char) {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3040 && code <= 0x309f) || // hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // katakana
    (code >= 0x4e00 && code <= 0x9fff) || // kanji (CJK unified)
    (code >= 0x3400 && code <= 0x4dbf)    // kanji extension A
  );
}

// Split text into Japanese "words" and non-Japanese spans
function wrapJapaneseWords(text) {
  const segments = [];
  let current = "";
  let inJapanese = false;

  for (const char of text) {
    const jp = isJapanese(char);
    if (jp !== inJapanese) {
      if (current) segments.push({ text: current, japanese: inJapanese });
      current = "";
      inJapanese = jp;
    }
    current += char;
  }
  if (current) segments.push({ text: current, japanese: inJapanese });

  return segments.map(seg => {
    if (seg.japanese) {
      // Split into individual "words" by grouping consecutive kanji/kana
      return `<span class="jp-word" style="cursor:pointer; border-bottom: 1px dashed #7878c8; transition: background 0.15s;" 
                   onmouseover="this.style.background='rgba(120,120,200,0.15)'" 
                   onmouseout="this.style.background=''">${seg.text}</span>`;
    }
    return seg.text.replace(/\n/g, "<br>");
  }).join("");
}

// Fetch from Jisho API (via proxy-friendly CDN or directly)
async function lookupWord(word) {
  try {
    const res = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`);
    const data = await res.json();
    return data.data?.[0] || null;
  } catch (e) {
    return null;
  }
}

// Show popup near the click position
function showPopup(x, y, html) {
  popup.innerHTML = html;
  popup.style.display = "block";

  // Position: try right of cursor, flip left if near edge
  const pw = 290;
  const left = (x + pw + 20 > window.innerWidth) ? x - pw - 10 : x + 12;
  const top = Math.min(y - 10, window.innerHeight - 200);

  popup.style.left = left + "px";
  popup.style.top = top + "px";
}

function hidePopup() {
  popup.style.display = "none";
}

// Handle click on a Japanese word span
read.addEventListener("click", async (e) => {
  const target = e.target.closest(".jp-word");
  if (!target) {
    hidePopup();
    return;
  }

  const word = target.textContent.trim();
  if (!word) return;

  // Show loading state
  showPopup(e.clientX, e.clientY, `
    <div style="color:#aaa; font-size:13px;">🔍 Buscando <strong style="color:#c8c8ff">${word}</strong>…</div>
  `);

  const result = await lookupWord(word);

  if (!result) {
    showPopup(e.clientX, e.clientY, `
      <div style="color:#ff8888;">No se encontró: <strong>${word}</strong></div>
    `);
    return;
  }

  const japanese = result.japanese?.[0] || {};
  const reading = japanese.reading || "—";
  const wordForm = japanese.word || word;
  const senses = result.senses?.slice(0, 3) || [];

  const meaningsHtml = senses.map((s, i) => {
    const defs = s.english_definitions?.slice(0, 3).join(", ") || "";
    const pos = s.parts_of_speech?.join(", ") || "";
    return `
      <div style="margin-top:6px; padding-top:6px; ${i > 0 ? 'border-top:1px solid #333;' : ''}">
        ${pos ? `<div style="color:#888; font-size:11px; text-transform:uppercase; letter-spacing:0.05em">${pos}</div>` : ""}
        <div style="color:#e8e8ff">${defs}</div>
      </div>`;
  }).join("");

  showPopup(e.clientX, e.clientY, `
    <div style="font-size:22px; font-weight:bold; color:#ffffff; font-family:'Noto Sans JP', sans-serif">${wordForm}</div>
    <div style="color:#a0a0ff; font-size:15px; margin-bottom:4px; font-family:'Noto Sans JP', sans-serif">【${reading}】</div>
    <hr style="border:none; border-top:1px solid #333; margin:6px 0">
    ${meaningsHtml}
    <div style="margin-top:8px; font-size:11px; color:#555; text-align:right">via Jisho.org</div>
  `);
});

// Close popup when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".jp-word") && !e.target.closest("#jp-popup")) {
    hidePopup();
  }
});

// Re-wrap words whenever text is updated
function refreshReadPanel(text) {
  read.innerHTML = wrapJapaneseWords(text);
}

// ─── Original functionality (modified) ──────────────────────────────────────

update.addEventListener('click', () => {
  fetch('update.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: write.value, username: username.value })
  })
  .then(res => res.text())
  .then(data => console.log(data));
});

reload.addEventListener('click', () => {
  fetch('reload.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.value })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    write.value = data.text;
    refreshReadPanel(data.text);
  });
});

write.addEventListener('input', () => {
  refreshReadPanel(write.value);
});

read.style.fontSize = size + "px";

readMode.addEventListener('click', () => {
  read.style.display = "block";
  write.style.display = "none";
});

writeMode.addEventListener('click', () => {
  read.style.display = "none";
  write.style.display = "block";
});

plus.addEventListener('click', () => {
  size += 3;
  read.style.fontSize = size + "px";
});

minus.addEventListener('click', () => {
  size -= 3;
  read.style.fontSize = size + "px";
});