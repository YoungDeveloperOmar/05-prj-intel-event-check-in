// script.js

(() => {
  const MAX_ATTENDEES = 50;

  const TEAM_LABELS = {
    water: "Team Water Wise",
    zero: "Team Net Zero",
    power: "Team Renewables",
  };

  const TEAM_EMOJIS = {
    water: "🌊",
    zero: "🌿",
    power: "⚡",
  };

  const STORAGE_KEY = "intel_summit_checkin_v1";

  const form = document.getElementById("checkInForm");
  const nameInput = document.getElementById("attendeeName");
  const teamSelect = document.getElementById("teamSelect");

  const greetingEl = document.getElementById("greeting");

  const attendeeCountEl = document.getElementById("attendeeCount");
  const progressBarEl = document.getElementById("progressBar");

  const waterCountEl = document.getElementById("waterCount");
  const zeroCountEl = document.getElementById("zeroCount");
  const powerCountEl = document.getElementById("powerCount");

  let state = {
    attendees: [],
  };

  const safeTrim = (s) => (s || "").trim();

  const normalizeName = (s) => safeTrim(s).replace(/\s+/g, " ").toLowerCase();

  const titleCaseName = (s) => {
    const cleaned = safeTrim(s).replace(/\s+/g, " ");
    return cleaned
      .split(" ")
      .map((part) =>
        part.length
          ? part[0].toUpperCase() + part.slice(1).toLowerCase()
          : part,
      )
      .join(" ");
  };

  const getCounts = () => {
    const counts = { water: 0, zero: 0, power: 0 };
    for (const a of state.attendees) {
      if (counts[a.team] !== undefined) counts[a.team] += 1;
    }
    return counts;
  };

  const getWinningTeam = () => {
    const counts = getCounts();
    const entries = Object.entries(counts);
    entries.sort((a, b) => b[1] - a[1]);

    const top = entries[0];
    const second = entries[1];

    if (!top || top[1] === 0) return null;

    if (second && top[1] === second[1]) return "tie";
    return top[0];
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("localStorage save failed:", err);
    }
  };

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed && Array.isArray(parsed.attendees)) {
        state.attendees = parsed.attendees
          .filter(
            (a) =>
              a &&
              typeof a.name === "string" &&
              ["water", "zero", "power"].includes(a.team),
          )
          .map((a) => ({
            name: a.name,
            team: a.team,
            time: typeof a.time === "number" ? a.time : Date.now(),
          }));
      }
    } catch (err) {
      console.warn("localStorage load failed:", err);
    }
  };

  const showMessage = (text, { success = true } = {}) => {
    greetingEl.textContent = text;
    greetingEl.style.display = "block";
    greetingEl.classList.toggle("success-message", success);
  };

  const updateProgress = (total) => {
    const pct = Math.min(100, Math.round((total / MAX_ATTENDEES) * 100));
    progressBarEl.style.width = `${pct}%`;
  };

  const ensureAttendeeListUI = () => {
    let listWrap = document.getElementById("attendeeListWrap");
    if (listWrap) return listWrap;

    const teamStats = document.querySelector(".team-stats");
    listWrap = document.createElement("div");
    listWrap.id = "attendeeListWrap";
    listWrap.style.marginTop = "22px";
    listWrap.style.textAlign = "left";

    const title = document.createElement("h3");
    title.textContent = "Attendee List";
    title.style.color = "#64748b";
    title.style.fontSize = "16px";
    title.style.marginBottom = "12px";

    const list = document.createElement("div");
    list.id = "attendeeList";
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";

    listWrap.appendChild(title);
    listWrap.appendChild(list);

    teamStats.appendChild(listWrap);
    return listWrap;
  };

  const renderAttendeeList = () => {
    ensureAttendeeListUI();
    const listEl = document.getElementById("attendeeList");
    if (!listEl) return;

    listEl.innerHTML = "";

    const sorted = [...state.attendees].sort((a, b) => b.time - a.time);

    if (sorted.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No attendees yet. First check-in will appear here.";
      empty.style.color = "#94a3b8";
      empty.style.fontSize = "14px";
      empty.style.padding = "10px 6px";
      listEl.appendChild(empty);
      return;
    }

    for (const attendee of sorted) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "12px 14px";
      row.style.borderRadius = "12px";
      row.style.background = "#f8fafc";
      row.style.border = "1px solid #eef2f7";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "2px";

      const name = document.createElement("div");
      name.textContent = attendee.name;
      name.style.fontWeight = "600";
      name.style.color = "#0f172a";
      name.style.fontSize = "15px";

      const team = document.createElement("div");
      team.textContent = `${TEAM_EMOJIS[attendee.team]} ${TEAM_LABELS[attendee.team]}`;
      team.style.color = "#64748b";
      team.style.fontSize = "13px";

      left.appendChild(name);
      left.appendChild(team);

      const time = document.createElement("div");
      const d = new Date(attendee.time);
      time.textContent = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      time.style.color = "#94a3b8";
      time.style.fontSize = "13px";

      row.appendChild(left);
      row.appendChild(time);
      listEl.appendChild(row);
    }
  };

  const render = () => {
    const total = state.attendees.length;
    const counts = getCounts();

    attendeeCountEl.textContent = String(total);
    waterCountEl.textContent = String(counts.water);
    zeroCountEl.textContent = String(counts.zero);
    powerCountEl.textContent = String(counts.power);

    updateProgress(total);
    renderAttendeeList();

    if (total >= MAX_ATTENDEES) {
      const winner = getWinningTeam();
      if (winner === "tie") {
        showMessage(
          `🎉 Goal reached! ${MAX_ATTENDEES} attendees checked in. It's a tie for highest turnout!`,
          { success: true },
        );
      } else if (winner) {
        showMessage(
          `🎉 Goal reached! ${MAX_ATTENDEES} attendees checked in. Winning team: ${TEAM_EMOJIS[winner]} ${TEAM_LABELS[winner]}!`,
          { success: true },
        );
      } else {
        showMessage(`🎉 Goal reached! ${MAX_ATTENDEES} attendees checked in!`, {
          success: true,
        });
      }
    }
  };

  const addAttendee = (rawName, team) => {
    const name = titleCaseName(rawName);
    const normalized = normalizeName(rawName);

    const already = state.attendees.some(
      (a) => normalizeName(a.name) === normalized,
    );
    if (already) {
      showMessage(`⚠️ "${name}" is already checked in.`, { success: false });
      return false;
    }

    if (state.attendees.length >= MAX_ATTENDEES) {
      showMessage(`⚠️ Check-in is full (${MAX_ATTENDEES}/${MAX_ATTENDEES}).`, {
        success: false,
      });
      return false;
    }

    state.attendees.push({
      name,
      team,
      time: Date.now(),
    });

    saveToStorage();
    render();

    showMessage(
      `🎉 Welcome, ${name}! You’re checked in with ${TEAM_EMOJIS[team]} ${TEAM_LABELS[team]}.`,
      { success: true },
    );

    return true;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const rawName = safeTrim(nameInput.value);
    const team = teamSelect.value;

    if (!rawName) {
      showMessage("⚠️ Please enter a name to check in.", { success: false });
      return;
    }
    if (!["water", "zero", "power"].includes(team)) {
      showMessage("⚠️ Please select a team.", { success: false });
      return;
    }

    const ok = addAttendee(rawName, team);
    if (ok) {
      nameInput.value = "";
      teamSelect.selectedIndex = 0;
      nameInput.focus();
    }
  });

  loadFromStorage();
  render();
})();
