// Replace with your actual deployed URL
const GAME_URL = "https://impostor.vercel.app";

/* ── SVG character definitions ──────────────────────────────────────────── */

const IMPOSTOR_HEAD_SVG = `
<svg viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="auto">
  <path d="M14 28 Q28 14 42 28 Q38 16 28 10 Q18 16 14 28Z" fill="#0e0720"/>
  <ellipse cx="28" cy="36" rx="18" ry="18" fill="#201548"/>
  <path d="M14 30 Q28 22 42 30 Q40 26 28 24 Q16 26 14 30Z" fill="#12092c" opacity="0.75"/>
  <ellipse cx="21" cy="36" rx="5" ry="5" fill="#8070d4" opacity="0.18"/>
  <ellipse cx="21" cy="36" rx="3.2" ry="3.2" fill="#9080e0"/>
  <ellipse cx="20" cy="35" rx="1.1" ry="1.1" fill="rgba(255,255,255,0.4)"/>
  <ellipse cx="35" cy="36" rx="5" ry="5" fill="#8070d4" opacity="0.18"/>
  <ellipse cx="35" cy="36" rx="3.2" ry="3.2" fill="#9080e0"/>
  <ellipse cx="34" cy="35" rx="1.1" ry="1.1" fill="rgba(255,255,255,0.4)"/>
  <path d="M23 44 Q28 47 33 44" stroke="#4d3590" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M37 42 Q40 37 38 33" stroke="#2a1e58" stroke-width="3" stroke-linecap="round"/>
  <circle cx="38" cy="31" r="2.2" fill="#2a1e58"/>
</svg>`;

const IMPOSTOR_FULL_SVG = `
<svg viewBox="0 0 160 240" fill="none" xmlns="http://www.w3.org/2000/svg" width="68" height="auto">
  <path d="M28 112 Q80 94 132 112 L142 222 Q80 242 18 222 Z" fill="#150d30"/>
  <path d="M46 70 Q80 46 114 70 Q108 48 80 36 Q52 48 46 70Z" fill="#0e0720"/>
  <ellipse cx="80" cy="84" rx="34" ry="33" fill="#201548"/>
  <path d="M47 76 Q80 62 113 76 Q110 68 80 64 Q50 68 47 76Z" fill="#12092c" opacity="0.7"/>
  <ellipse cx="66" cy="85" rx="10" ry="10" fill="#8070d4" opacity="0.12"/>
  <ellipse cx="66" cy="85" rx="6" ry="6" fill="#9080e0"/>
  <ellipse cx="64" cy="83" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.35)"/>
  <ellipse cx="94" cy="85" rx="10" ry="10" fill="#8070d4" opacity="0.12"/>
  <ellipse cx="94" cy="85" rx="6" ry="6" fill="#9080e0"/>
  <ellipse cx="92" cy="83" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.35)"/>
  <path d="M70 100 Q80 104 90 100" stroke="#4d3590" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
  <path d="M110 120 Q122 100 110 84" stroke="#1c1240" stroke-width="15" stroke-linecap="round"/>
  <path d="M110 84 Q98 73 84 78" stroke="#1c1240" stroke-width="12" stroke-linecap="round"/>
  <ellipse cx="80" cy="80" rx="11" ry="10" fill="#2a1e58"/>
  <path d="M79 80 Q77 66 79 60" stroke="#3a2870" stroke-width="6.5" stroke-linecap="round"/>
  <circle cx="79" cy="57" r="4.5" fill="#3a2870"/>
  <path d="M50 120 Q38 138 40 153" stroke="#1c1240" stroke-width="15" stroke-linecap="round"/>
  <ellipse cx="40" cy="156" rx="11" ry="9" fill="#2a1e58"/>
</svg>`;

const INNOCENT_FULL_SVG = `
<svg viewBox="0 0 160 240" fill="none" xmlns="http://www.w3.org/2000/svg" width="68" height="auto">
  <ellipse cx="80" cy="160" rx="36" ry="46" fill="#0d2840"/>
  <rect x="72" y="110" width="16" height="20" rx="8" fill="#163a58"/>
  <circle cx="80" cy="90" r="34" fill="#163a58"/>
  <circle cx="64" cy="86" r="10" fill="rgba(255,255,255,0.88)"/>
  <circle cx="64" cy="86" r="6" fill="#4d94b8"/>
  <circle cx="64" cy="86" r="3" fill="#0d2840"/>
  <circle cx="66" cy="84" r="2" fill="rgba(255,255,255,0.9)"/>
  <circle cx="96" cy="86" r="10" fill="rgba(255,255,255,0.88)"/>
  <circle cx="96" cy="86" r="6" fill="#4d94b8"/>
  <circle cx="96" cy="86" r="3" fill="#0d2840"/>
  <circle cx="98" cy="84" r="2" fill="rgba(255,255,255,0.9)"/>
  <ellipse cx="80" cy="106" rx="7" ry="6" fill="#0a1e30"/>
  <path d="M48 136 Q34 112 38 86" stroke="#163a58" stroke-width="15" stroke-linecap="round"/>
  <ellipse cx="38" cy="83" rx="11" ry="10" fill="#1f4d6a"/>
  <path d="M34 78 Q31 68 33 62" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M38 76 Q36 66 38 60" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M42 78 Q42 68 44 62" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M112 136 Q126 112 122 86" stroke="#163a58" stroke-width="15" stroke-linecap="round"/>
  <ellipse cx="122" cy="83" rx="11" ry="10" fill="#1f4d6a"/>
  <path d="M118 78 Q116 68 118 62" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M122 76 Q121 66 124 60" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M126 78 Q127 68 130 62" stroke="#1f4d6a" stroke-width="5.5" stroke-linecap="round"/>
</svg>`;

/* ── Inject characters ───────────────────────────────────────────────────── */

document.getElementById("logo-mark").innerHTML = IMPOSTOR_HEAD_SVG;
document.getElementById("char-impostor").innerHTML = IMPOSTOR_FULL_SVG;
document.getElementById("char-innocent").innerHTML = INNOCENT_FULL_SVG;

/* ── Nav links ───────────────────────────────────────────────────────────── */

document.getElementById("btn-play-local").href = `${GAME_URL}/local/setup`;
document.getElementById("btn-play-online").href = `${GAME_URL}/rooms`;

/* ── Join by code ────────────────────────────────────────────────────────── */

const codeInput = document.getElementById("code-input");
const joinBtn = document.getElementById("btn-join");

function updateJoinBtn() {
  joinBtn.disabled = codeInput.value.length !== 4;
}

codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  updateJoinBtn();
});

codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && codeInput.value.length === 4) {
    handleJoin();
  }
});

joinBtn.addEventListener("click", handleJoin);

function handleJoin() {
  const code = codeInput.value.toUpperCase();
  if (code.length !== 4) return;
  chrome.tabs.create({ url: `${GAME_URL}/rooms/${code}` });
}

// Initial state
updateJoinBtn();
