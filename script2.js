let currentMood = "", deleteDate = "", pieChartInstance = null;

const quotes = [
  "🌸 Every day is a new beginning. Take a deep breath and start again. ✨",
  "💜 Your feelings are valid. Honour them, then let them guide you. 🌷",
  "🪻 Small steps every day lead to big changes over time. 💫",
  "🌸 You don't have to be perfect to be worthy of love and care. 💜",
  "✨ Tracking your mood is an act of self-love. Keep going. 🫧",
  "🌷 The only way out is through — and you're already doing it. 💪",
  "💫 Be gentle with yourself. You are a work in progress. 🌸",
  "🪻 Even on your hardest days, you showed up. That counts. 💜",
  "🫧 Feelings are visitors. Let them come, teach, and go. ✨",
  "🌷 Today's struggles are tomorrow's strength. 🌸"
];
document.getElementById("dailyQuote").innerText = quotes[new Date().getDate() % quotes.length];

const moodColor = {
  happy: "#43e97b", good: "#f9ca24", meh: "#4fc3f7",
  sad: "#ff9a3c", bad: "#ff9a3c", awful: "#ff4d6d"
};
const moodLabel = {
  happy: "😄 Happy", good: "🙂 Good", meh: "😐 Meh",
  sad: "😢 Sad", bad: "😢 Sad", awful: "😡 Awful"
};
const catFace = {
  happy: "😸", good: "😺", meh: "😾",
  sad: "🙀", awful: "😿", default: "🐱"
};

const VALID_MOODS = ["happy", "good", "meh", "sad", "bad", "awful"];

function localDateStr(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function isValidDateStr(str) {
  if (!str || typeof str !== "string") return false;
  // Must be YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function getLabel(mood) { return moodLabel[mood] || "Unknown"; }
function getColor(mood) { return moodColor[mood] || "#ccc"; }

/* ── CLEAN + GET MOODS ── */
function getMoods() {
  let moods = JSON.parse(localStorage.getItem("moods")) || [];
  // Remove any entry with invalid date or unknown mood
  moods = moods.filter(m =>
    isValidDateStr(m.date) && VALID_MOODS.includes(m.mood)
  );
  // Normalise "bad" → "sad"
  moods = moods.map(m => ({ ...m, mood: m.mood === "bad" ? "sad" : m.mood }));
  // De-duplicate — keep one per date (last wins)
  const seen = {};
  moods.forEach(m => { seen[m.date] = m; });
  moods = Object.values(seen).sort((a, b) => a.date.localeCompare(b.date));
  return moods;
}

function saveMoods(moods) {
  localStorage.setItem("moods", JSON.stringify(moods));
}

/* ── INIT ── */
const todayStr = localDateStr(new Date());
document.getElementById("moodDate").value = todayStr;
document.getElementById("monthSelect").value = new Date().getMonth();
updateHomeForDate(todayStr);

document.getElementById("moodDate").addEventListener("change", function () {
  updateHomeForDate(this.value);
});

/* ── HOME ── */
function updateHomeForDate(date) {
  const moods = getMoods();
  const found = moods.find(m => m.date === date);
  const area = document.getElementById("deleteArea");
  const btns = document.querySelectorAll(".moods button");

  area.innerHTML = "";
  btns.forEach(b => { b.classList.remove("selected"); b.disabled = false; });
  currentMood = "";

  if (found) {
    btns.forEach(b => b.disabled = true);
    const [y, mo, dy] = date.split("-").map(Number);
    const niceDate = new Date(y, mo - 1, dy).toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric"
    });

    document.querySelector(`.moods button.${found.mood}`)?.classList.add("selected");
    document.getElementById("cat-sticker").textContent = catFace[found.mood] || catFace.default;

    const banner = document.createElement("div");
    banner.className = "locked-banner";
    banner.innerHTML = `<strong>✅ Logged for ${niceDate}</strong>
      You felt <b>${getLabel(found.mood)}</b>${found.activities.length ? " — " + found.activities.join(", ") : ""}.<br>
      <span style="color:#888;font-size:0.82rem;">Delete to re-enter this day.</span>`;
    area.appendChild(banner);

    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️ Delete This Entry";
    delBtn.className = "deleteBtn";
    delBtn.onclick = () => {
      if (delBtn.dataset.confirming === "1") {
        saveMoods(getMoods().filter(m => m.date !== date));
        updateHomeForDate(date);
      } else {
        delBtn.dataset.confirming = "1";
        delBtn.innerText = "⚠️ Tap again to confirm";
        delBtn.style.background = "#ff8d8d";
        setTimeout(() => {
          if (delBtn.dataset.confirming === "1") {
            delBtn.dataset.confirming = "0";
            delBtn.innerText = "🗑️ Delete This Entry";
            delBtn.style.background = "";
          }
        }, 3000);
      }
    };
    area.appendChild(delBtn);
    deleteDate = date;
  } else {
    deleteDate = "";
    document.getElementById("cat-sticker").textContent = catFace.default;
  }
}

/* ── SELECT MOOD ── */
function selectMood(e, mood) {
  if (e.target.disabled) return;
  currentMood = mood;
  document.querySelectorAll(".moods button").forEach(b => b.classList.remove("selected"));
  e.target.classList.add("selected");
  document.getElementById("cat-sticker").textContent = catFace[mood] || catFace.default;
}

/* ── SAVE MOOD ── */
function saveMood() {
  const date = document.getElementById("moodDate").value;
  if (!date || !currentMood) { alert("Select a date and mood first."); return; }

  const moods = getMoods();
  if (moods.find(m => m.date === date)) {
    alert("⚠️ Already logged for this date. Delete it first to re-enter.");
    return;
  }

  const activities = [];
  document.querySelectorAll('input[name="activity"]:checked').forEach(a => activities.push(a.value));

  const otherCheck = document.getElementById("otherCheck");
  const otherText = document.getElementById("otherText").value.trim();
  if (otherCheck.checked) {
    if (!otherText) { alert("Describe your other activity."); return; }
    if (otherText.split(/\s+/).length > 20) { alert("Max 20 words."); return; }
    activities.push(otherText);
  }

  moods.push({ date, mood: currentMood, activities });
  moods.sort((a, b) => a.date.localeCompare(b.date));
  saveMoods(moods);
  alert("✅ Mood saved!");

  document.querySelectorAll('input[name="activity"]:checked').forEach(cb => cb.checked = false);
  document.getElementById("otherCheck").checked = false;
  document.getElementById("otherText").value = "";
  currentMood = "";
  updateHomeForDate(date);
}

/* ── NAVIGATION ── */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("nav-" + id)?.classList.add("active");
  setTimeout(() => {
    if (id === "weekly")   drawWeekly();
    if (id === "monthly")  drawMonthly();
    if (id === "calendar") drawCalendar();
  }, 50);
}

/* ── WEEKLY ── */
function drawWeekly() {
  const moods = getMoods(); // already cleaned & deduplicated
  const box = document.getElementById("weeklyText");
  box.innerHTML = "";

  if (!moods.length) {
    box.innerHTML = '<div class="no-data">No entries yet. Start logging! 🌱</div>';
    return;
  }

  // Sort newest first, take up to 7
  const recent = [...moods]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  recent.forEach(m => {
    const [y, mo, dy] = m.date.split("-").map(Number);
    const dateStr = new Date(y, mo - 1, dy).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
    const activities = Array.isArray(m.activities) ? m.activities.filter(Boolean) : [];
    const reason = activities.length > 0 ? activities.join(", ") : getLabel(m.mood);

    const div = document.createElement("div");
    div.className = "weekCard";
    div.style.borderLeftColor = getColor(m.mood);
    div.innerHTML = `<strong>${dateStr}</strong>: You were <b>${getLabel(m.mood)}</b> because of <em>${reason}</em>`;
    box.appendChild(div);
  });
}

/* ── MONTHLY ── */
function drawMonthly() {
  const moods = getMoods(); // already cleaned & deduplicated

  const count = { happy: 0, good: 0, meh: 0, sad: 0, awful: 0 };
  moods.forEach(m => { if (m.mood in count) count[m.mood]++; });

  // Destroy + replace canvas to fix Chart.js hidden-tab sizing bug
  if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
  const oldCanvas = document.getElementById("pieChart");
  const newCanvas = document.createElement("canvas");
  newCanvas.id = "pieChart";
  oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);

  pieChartInstance = new Chart(newCanvas, {
    type: "doughnut",
    data: {
      labels: ["Happy", "Good", "Meh", "Sad", "Awful"],
      datasets: [{
        data: [count.happy, count.good, count.meh, count.sad, count.awful],
        backgroundColor: ["#43e97b", "#f9ca24", "#4fc3f7", "#ff9a3c", "#ff4d6d"],
        borderWidth: 2, borderColor: "#fff"
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { font: { family: "Poppins", size: 12 }, padding: 14 } }
      },
      cutout: "55%"
    }
  });

  // Monthly quote
  const quoteBox = document.getElementById("monthlyQuote");
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  if (!total) { quoteBox.style.display = "none"; return; }

  const dominant = Object.entries(count).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const posRatio = (count.happy + count.good) / total;
  const negRatio = (count.sad + count.awful) / total;

  const mq = {
    happy: { e: "😸🌈", t: "What a wonderful month! You radiated happiness — keep spreading that sunshine! ☀️" },
    good:  { e: "😺✨", t: "A pretty great month! Lots of good vibes. 🌿 Keep nurturing what makes you feel this way." },
    meh:   { e: "😾🌧️", t: "A \"meh\" month — and that's okay! Every day you got through still counts. 💪" },
    sad:   { e: "🙀💜", t: "A tough month. You are stronger than you know. 🌸 Better days are coming." },
    awful: { e: "😿🫂", t: "This month was really hard, and you still showed up. 💜 Please reach out to someone you trust." }
  };

  const pick = posRatio >= 0.6 ? mq.happy
    : negRatio >= 0.6 ? (count.awful >= count.sad ? mq.awful : mq.sad)
    : (mq[dominant] || mq.meh);

  const borderColors = { happy: "#43e97b", good: "#f9ca24", meh: "#4fc3f7", sad: "#ff9a3c", awful: "#ff4d6d" };
  quoteBox.style.display = "block";
  quoteBox.style.borderColor = borderColors[dominant] || "#c4a0e8";
  quoteBox.innerHTML = `<span style="font-size:1.5rem">${pick.e}</span><br><br>${pick.t}`;
}

/* ── CALENDAR ── */
function drawCalendar() {
  const moods = getMoods();
  const monthIndex = parseInt(document.getElementById("monthSelect").value);
  const year = 2026;
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const moodMap = {};
  moods.forEach(m => { moodMap[m.date] = m.mood; });

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement("div");
    e.className = "day empty";
    grid.appendChild(e);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const div = document.createElement("div");
    div.className = "day";
    div.innerText = d;
    if (moodMap[dateStr]) {
      div.style.background = getColor(moodMap[dateStr]);
      div.classList.add("has-mood");
      div.title = getLabel(moodMap[dateStr]);
    }
    grid.appendChild(div);
  }
}