// Reverse Eliminator — pick a team to LOSE each week. Pick a winner, or miss a week, and you're out.
// Real accounts via Firebase Auth (email/password) — signing up auto-enters you in the pool.

const TOTAL_WEEKS = 18;

// Only these signed-in emails see the Admin tab.
const ADMIN_EMAILS = [
  "edenchaz@gmail.com",
];

// Used only until Firebase is configured (e.g. previewing locally before setup) — see README.md.
const FALLBACK_PLAYERS = [
  { id: "chaz", name: "Chaz" },
  { id: "tristan", name: "Tristan" },
  { id: "sean", name: "Sean" },
  { id: "ty-gadbois", name: "Ty Gadbois" },
  { id: "ty-crewson", name: "Ty Crewson" },
  { id: "prewitte", name: "Prewitte" },
  { id: "mario", name: "Mario" },
];

// Seeded from the Week 1 sportsbook screenshot. Keyed "week_awayAbbr_homeAbbr".
// Real odds entered via the "Edit odds" button on each matchup (saved to Firestore) take priority over this.
const FALLBACK_ODDS = {
  "1_NE_SEA": { awaySpread: "+3 (-105)", awayML: "+153", homeSpread: "-3 (-115)", homeML: "-175" },
  "1_SF_LAR": { awaySpread: "+3.5 (-102)", awayML: "+177", homeSpread: "-3.5 (-118)", homeML: "-205" },
  "1_CLE_JAX": { awaySpread: "+9 (-115)", awayML: "+316", homeSpread: "-9 (-105)", homeML: "-400" },
  "1_TB_CIN": { awaySpread: "+4 (-115)", awayML: "+174", homeSpread: "-4 (-105)", homeML: "-200" },
  "1_BAL_IND": { awaySpread: "-3.5 (+102)", awayML: "-175", homeSpread: "+3.5 (-122)", homeML: "+153" },
  "1_ATL_PIT": { awaySpread: "+3.5 (-116)", awayML: "+157", homeSpread: "-3.5 (-104)", homeML: "-180" },
  "1_BUF_HOU": { awaySpread: "-1 (-110)", awayML: "-121", homeSpread: "+1 (-110)", homeML: "+101" },
  "1_CHI_CAR": { awaySpread: "-3 (-115)", awayML: "-170", homeSpread: "+3 (-105)", homeML: "+149" },
  "1_NYJ_TEN": { awaySpread: "Pk (-104)", awayML: "", homeSpread: "Pk (-116)", homeML: "" },
  "1_NO_DET": { awaySpread: "+7 (-116)", awayML: "+252", homeSpread: "-7 (-104)", homeML: "-310" },
  "1_ARI_LAC": { awaySpread: "+9.5 (-110)", awayML: "+393", homeSpread: "-9.5 (-110)", homeML: "-515" },
  "1_MIA_LV": { awaySpread: "+3.5 (-114)", awayML: "+157", homeSpread: "-3.5 (-106)", homeML: "-180" },
  "1_WSH_PHI": { awaySpread: "+4.5 (-107)", awayML: "+189", homeSpread: "-4.5 (-113)", homeML: "-225" },
  "1_GB_MIN": { awaySpread: "+1 (-105)", awayML: "+103", homeSpread: "-1 (-115)", homeML: "-123" },
  "1_DAL_NYG": { awaySpread: "-3 (-107)", awayML: "-158", homeSpread: "+3 (-113)", homeML: "+138" },
  "1_DEN_KC": { awaySpread: "+2.5 (-104)", awayML: "+125", homeSpread: "-2.5 (-116)", homeML: "-145" },

  "2_CIN_HOU": { awaySpread: "+2.5 (+100)", awayML: "+128", homeSpread: "-2.5 (-120)", homeML: "-148" },
  "2_NO_BAL": { awaySpread: "+9 (-121)", awayML: "+324", homeSpread: "-9 (+101)", homeML: "-410" },
  "2_PHI_TEN": { awaySpread: "-7 (-113)", awayML: "-340", homeSpread: "+7 (-107)", homeML: "+274" },
  "2_LV_LAC": { awaySpread: "+6.5 (-110)", awayML: "+237", homeSpread: "-6.5 (-110)", homeML: "-290" },
  "2_JAX_DEN": { awaySpread: "+2.5 (+100)", awayML: "+133", homeSpread: "-2.5 (-120)", homeML: "-153" },
  "2_WSH_DAL": { awaySpread: "+4 (-110)", awayML: "+180", homeSpread: "-4 (-110)", homeML: "-210" },
  "2_SEA_ARI": { awaySpread: "-4 (-105)", awayML: "-195", homeSpread: "+4 (-115)", homeML: "+170" },
  "2_MIA_SF": { awaySpread: "+13 (-105)", awayML: "+661", homeSpread: "-13 (-115)", homeML: "-1000" },
  "2_IND_KC": { awaySpread: "+6.5 (-105)", awayML: "+237", homeSpread: "-6.5 (-115)", homeML: "-290" },
  "2_NYG_LAR": { awaySpread: "+7.5 (-120)", awayML: "+280", homeSpread: "-7.5 (+100)", homeML: "-350" },
  "2_DET_BUF": { awaySpread: "+5 (-106)", awayML: "+192", homeSpread: "-5 (-114)", homeML: "-230" },
  "2_GB_NYJ": { awaySpread: "-3.5 (-105)", awayML: "-175", homeSpread: "+3.5 (-115)", homeML: "+153" },
  "2_MIN_CHI": { awaySpread: "+5 (-114)", awayML: "+195", homeSpread: "-5 (-106)", homeML: "-235" },
  "2_PIT_NE": { awaySpread: "+5 (-110)", awayML: "+200", homeSpread: "-5 (-110)", homeML: "-240" },
  "2_CAR_ATL": { awaySpread: "-2.5 (-115)", awayML: "-145", homeSpread: "+2.5 (-105)", homeML: "+125" },
  "2_CLE_TB": { awaySpread: "+8.5 (-115)", awayML: "+320", homeSpread: "-8.5 (-105)", homeML: "-405" },
};

const state = {
  currentUser: null,
  needsName: false,      // true right after a first-time Google sign-in, until they pick a display name
  playerId: "",
  players: [],          // [{id, name}]
  currentWeek: 1,
  espnWeek: 1,           // ESPN's auto-detected week, before any admin override
  weekOverride: null,    // admin-set override (Firestore config/app.currentWeekOverride), or null
  year: new Date().getFullYear(),
  seasontype: 2,
  activeView: "home",
  activeWeek: null,
  weekCache: {},         // week -> games[]
  allPicks: {},          // "playerId_week" -> pick doc
  allOdds: {},           // "week_awayAbbr_homeAbbr" -> odds doc
};

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2500);
}

async function init() {
  // Fire-and-forget: Firebase must never block the ESPN-driven schedule UI below.
  // (With an unconfigured/invalid firebaseConfig, a Firestore/Auth request can hang indefinitely
  // instead of failing fast, so none of this may be awaited here.)
  renderAccountBox(); // show the sign-up form immediately, don't wait on Firebase
  listenToPlayers();
  listenToPicks();
  listenToOdds();
  listenToAuth();
  listenToConfig();
  renderInAppBrowserWarning();

  try {
    const info = await fetchCurrentWeekInfo();
    state.espnWeek = info.week;
    state.year = info.year;
    state.seasontype = info.seasontype;
  } catch (e) {
    console.error("Could not detect current week from ESPN", e);
  }

  await applyCurrentWeek();

  // Tabs added later (like Admin, only for admin emails) still work — delegate from the parent.
  document.getElementById("mainTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeView = btn.dataset.view;
    const hideWeekTabs = state.activeView === "standings";
    document.getElementById("weekTabs").style.display = hideWeekTabs ? "none" : "flex";
    render();
  });

  // Lock/reveal state and scores only refresh when the page (re)loads — not on a timer.
}

// Recomputes state.currentWeek from the admin override (if set) or ESPN's auto-detected week,
// reloads whatever weeks are newly needed, and refreshes the UI.
async function applyCurrentWeek() {
  const week = state.weekOverride || state.espnWeek;
  const changed = week !== state.currentWeek;
  state.currentWeek = week;
  if (!state.activeWeek || changed) state.activeWeek = week;
  renderWeekTabs();
  await loadWeeksUpTo(state.currentWeek);
  render();
  scheduleScoreRefreshes(state.currentWeek);
}

// Instead of polling ESPN on an interval, schedule one refetch per distinct kickoff slot in the
// current week — timed for roughly when games in that slot are typically over (kickoff + 3.5hrs).
// A Thu night game, the Sun early/late batches, and Sun/Mon night games each get exactly one
// scheduled refresh, whenever a slot's start time is still ahead of us on this page load.
function scheduleScoreRefreshes(week) {
  const games = state.weekCache[week];
  if (!games || !games.length) return;

  const GAME_DURATION_MS = 3.5 * 60 * 60 * 1000;
  const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // don't bother scheduling more than a day out
  const now = Date.now();
  const seenKickoffs = new Set();

  games.forEach(g => {
    const kickoff = new Date(g.date).getTime();
    if (seenKickoffs.has(kickoff)) return;
    seenKickoffs.add(kickoff);

    const fireAt = kickoff + GAME_DURATION_MS;
    const delay = fireAt - now;
    if (delay <= 0 || delay > MAX_LOOKAHEAD_MS) return;

    setTimeout(async () => {
      try {
        state.weekCache[week] = await fetchWeek(week, state.year, state.seasontype);
        render();
      } catch (e) {
        console.error("Scheduled score refresh failed", e);
      }
    }, delay);
  });
}

function listenToConfig() {
  attachWithRetry("config", (onError) => {
    db.collection("config").doc("app").onSnapshot(doc => {
      state.weekOverride = (doc.exists && doc.data().currentWeekOverride) || null;
      applyCurrentWeek();
    }, onError);
  });
}

// Firestore's very first listener attempt right after page load can transiently fail
// (permission-denied is not auto-retried by the SDK like network errors are), so each
// listener retries itself a few times with backoff instead of giving up for the session.
function attachWithRetry(name, attach, retriesLeft = 5, onGiveUp) {
  try {
    attach((err) => {
      console.error(`${name} listener error`, err);
      if (retriesLeft > 0) {
        setTimeout(() => attachWithRetry(name, attach, retriesLeft - 1, onGiveUp), 1500);
      } else if (onGiveUp) {
        onGiveUp();
      }
    });
  } catch (e) {
    console.error(`Could not attach ${name} listener`, e);
    if (onGiveUp) onGiveUp();
  }
}

function listenToPlayers() {
  attachWithRetry("players", (onError) => {
    db.collection("players").onSnapshot(snap => {
      // Real Firestore data always wins here, even if empty — FALLBACK_PLAYERS is only
      // for when Firebase is genuinely unreachable (e.g. not configured yet), not for a
      // real, empty players collection (nobody's signed up yet).
      state.players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      state.players.sort((a, b) => a.name.localeCompare(b.name));
      renderAccountBox();
      render();
    }, onError);
  }, 5, () => {
    state.players = FALLBACK_PLAYERS;
    renderAccountBox();
    render();
  });
}

function listenToPicks() {
  attachWithRetry("picks", (onError) => {
    db.collection("picks").onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        const d = change.doc.data();
        const key = `${d.playerId}_${d.week}`;
        if (change.type === "removed") delete state.allPicks[key];
        else state.allPicks[key] = d;
      });
      render();
    }, onError);
  });
}

function listenToOdds() {
  attachWithRetry("odds", (onError) => {
    db.collection("odds").onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === "removed") delete state.allOdds[change.doc.id];
        else state.allOdds[change.doc.id] = change.doc.data();
      });
      render();
    }, onError);
  });
}

// --- Auth ---

function isAdmin() {
  return !!(state.currentUser && ADMIN_EMAILS.includes(state.currentUser.email));
}

function updateAdminTabVisibility() {
  const nav = document.getElementById("mainTabs");
  let btn = nav.querySelector('[data-view="admin"]');
  if (isAdmin() && !btn) {
    btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.dataset.view = "admin";
    btn.textContent = "Admin";
    nav.appendChild(btn);
  } else if (!isAdmin() && btn) {
    btn.remove();
    if (state.activeView === "admin") state.activeView = "home";
  }
}

function listenToAuth() {
  try {
    auth.onAuthStateChanged(async user => {
      state.currentUser = user;
      state.playerId = user ? user.uid : "";
      if (user) {
        try {
          const existing = await db.collection("players").doc(user.uid).get();
          // New player: ask them to pick their own display name rather than assuming their Google name.
          state.needsName = !existing.exists;
        } catch (e) {
          console.error("Could not check for existing player doc", e);
        }
      } else {
        state.needsName = false;
      }
      renderAccountBox();
      updateAdminTabVisibility();
      render();
    });
  } catch (e) {
    console.error("Could not attach auth listener — is js/firebase-config.js set up?", e);
    renderAccountBox();
  }
}

function signInWithGoogle() {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => toast(e.message));
}

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|Snapchat|Line\/|MicroMessenger|TikTok|BytedanceWebview/i.test(ua);
}

// Google refuses to complete sign-in inside these embedded browsers (its own security
// policy, not something we can fix from our side) — warn people up front instead of
// letting them hit a silent blank-page hang after tapping "Sign in with Google".
function renderInAppBrowserWarning() {
  if (!isInAppBrowser()) return;
  const banner = document.createElement("div");
  banner.className = "in-app-warning";
  banner.textContent = "Google sign-in won't work inside this app's browser. Tap ⋯ or the share icon and choose \"Open in Chrome/Safari\", then sign in there.";
  document.body.insertBefore(banner, document.body.firstChild);
}

async function saveDisplayName(name) {
  if (!name) { toast("Enter your name."); return; }
  try {
    await db.collection("players").doc(state.currentUser.uid).set({
      name,
      email: state.currentUser.email,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    state.needsName = false;
    toast(`Welcome ${name} — you're entered in the pool!`);
    renderAccountBox();
  } catch (e) {
    toast(e.message);
  }
}

function renderAccountBox() {
  const box = document.getElementById("accountBox");
  if (!box) return;

  if (state.currentUser && state.needsName) {
    box.innerHTML = `
      <form id="nameForm" class="name-form">
        <input id="nameInput" type="text" placeholder="Enter your name" class="auth-input" autofocus />
        <button type="submit" class="btn-primary">Save</button>
      </form>`;
    document.getElementById("nameForm").addEventListener("submit", (e) => {
      e.preventDefault();
      saveDisplayName(document.getElementById("nameInput").value.trim());
    });
    return;
  }

  if (state.currentUser) {
    const me = state.players.find(p => p.id === state.playerId);
    box.innerHTML = `
      <div class="account-info">
        <span class="account-name">${me ? me.name : state.currentUser.email}</span>
        <button id="logoutBtn" class="btn-ghost">Log out</button>
      </div>`;
    document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());
    return;
  }

  box.innerHTML = `<button id="googleSignInBtn" class="btn-primary btn-google">Sign in with Google</button>`;
  document.getElementById("googleSignInBtn").addEventListener("click", signInWithGoogle);
}

// Your result for that week's pick — 🏈 while the current week's pick hasn't resolved yet,
// ✅ once it's locked in and correct (picked team lost/tied — wait, tie counts as a miss, see below),
// ❌ once it's locked in and wrong (picked team won, or tied — a tie counts as a miss).
function weekResultIcon(week) {
  const pick = state.playerId ? getPick(state.playerId, week) : null;
  if (pick) {
    const games = state.weekCache[week];
    const game = games && games.find(g => g.id === pick.gameId);
    if (game && game.completed) {
      const team = game.home.abbr === pick.teamAbbr ? game.home : game.away;
      return team.winner === false ? "✅" : "❌";
    }
  }
  return week === state.currentWeek ? "🏈" : "";
}

function renderWeekTabs() {
  const el = document.getElementById("weekTabs");
  el.innerHTML = "";
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const btn = document.createElement("div");
    btn.className = "week-tab" + (w === state.activeWeek ? " active" : "");
    btn.innerHTML = `<div class="wk-label">Week ${w}</div><div class="wk-dates">&nbsp;</div><div class="wk-status">${weekResultIcon(w)}</div>`;
    btn.addEventListener("click", async () => {
      state.activeWeek = w;
      renderWeekTabs();
      await loadWeek(w);
      render();
    });
    el.appendChild(btn);
  }
}

// Cheap refresh of just the result icons (called on every render()) — avoids rebuilding the
// whole week-tabs nav, which would wipe out the async-loaded date labels each time.
function updateWeekTabIcons() {
  document.querySelectorAll("#weekTabs .week-tab").forEach((tab, i) => {
    const status = tab.querySelector(".wk-status");
    if (status) status.textContent = weekResultIcon(i + 1);
  });
}

async function loadWeek(week) {
  if (state.weekCache[week]) return state.weekCache[week];
  try {
    const games = await fetchWeek(week, state.year, state.seasontype);
    state.weekCache[week] = games;
    updateWeekDatesLabel(week, games);
    return games;
  } catch (e) {
    console.error("Failed to load week", week, e);
    return [];
  }
}

async function loadWeeksUpTo(week) {
  const weeks = [];
  for (let w = 1; w <= week; w++) weeks.push(loadWeek(w));
  await Promise.all(weeks);
}

function updateWeekDatesLabel(week, games) {
  if (!games.length) return;
  const dates = games.map(g => new Date(g.date)).sort((a, b) => a - b);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const label = `${fmt(dates[0])} - ${fmt(dates[dates.length - 1])}`;
  const tabs = document.querySelectorAll("#weekTabs .week-tab");
  const tab = tabs[week - 1];
  if (tab) tab.querySelector(".wk-dates").textContent = label;
}

// --- Pick helpers ---

function getPick(playerId, week) {
  return state.allPicks[`${playerId}_${week}`];
}

// Names of everyone who picked this team, in this game/week — only meaningful to call once the game has locked.
function playersWhoPicked(week, gameId, teamAbbr) {
  return Object.values(state.allPicks)
    .filter(p => p.week === week && p.gameId === gameId && p.teamAbbr === teamAbbr)
    .map(p => (state.players.find(pl => pl.id === p.playerId) || {}).name)
    .filter(Boolean);
}

function getOdds(week, awayAbbr, homeAbbr) {
  const key = `${week}_${awayAbbr}_${homeAbbr}`;
  return state.allOdds[key] || FALLBACK_ODDS[key] || null;
}

function usedTeams(playerId, uptoWeekExclusive) {
  const used = new Set();
  Object.values(state.allPicks).forEach(p => {
    if (p.playerId === playerId && p.week < uptoWeekExclusive) used.add(p.teamAbbr);
  });
  return used;
}

// Walk a player's history to compute record + elimination status.
function computePlayerStatus(playerId) {
  let wins = 0, losses = 0, eliminated = false, eliminatedWeek = null;
  for (let w = 1; w <= state.currentWeek; w++) {
    if (eliminated) break;
    const games = state.weekCache[w];
    if (!games || !games.length) continue; // week not loaded yet, skip (best-effort live view)

    const pick = getPick(playerId, w);
    if (!pick) {
      // No pick yet — only a loss once every game in the week has kicked off (no more games left to pick).
      const allStarted = games.every(g => new Date(g.date) <= new Date());
      if (!allStarted) break; // still time to make a pick this week
      eliminated = true; eliminatedWeek = w; losses++;
      break;
    }

    const game = games.find(g => g.id === pick.gameId);
    if (!game || !game.completed) break; // this player's game hasn't finished — resolve later weeks after this one

    const team = game.home.abbr === pick.teamAbbr ? game.home : game.away;
    if (team.winner === false) {
      wins++;
    } else {
      // team.winner === true (picked team won) or null (tie) both count as a miss.
      losses++; eliminated = true; eliminatedWeek = w;
    }
  }
  return { wins, losses, eliminated, eliminatedWeek };
}

async function makePick(week, game, team) {
  if (!state.playerId) { toast("Log in first."); return; }
  if (week !== state.currentWeek) { toast("You can only pick for the current week."); return; }

  const status = computePlayerStatus(state.playerId);
  if (status.eliminated) { toast("You're eliminated — no more picks."); return; }

  const kickoff = new Date(game.date);
  if (kickoff <= new Date()) { toast("That game has already started."); return; }

  const existing = getPick(state.playerId, week);
  if (existing) {
    const existingGame = (state.weekCache[week] || []).find(g => g.id === existing.gameId);
    if (existingGame && new Date(existingGame.date) <= new Date()) {
      toast("Your pick for this week is already locked.");
      return;
    }
  }

  const used = usedTeams(state.playerId, week);
  if (used.has(team.abbr) && !(existing && existing.teamAbbr === team.abbr)) {
    toast(`You've already picked the ${team.name} to lose in a previous week.`);
    return;
  }

  const opp = game.home.abbr === team.abbr ? game.away : game.home;
  const docId = `${state.playerId}_${week}`;
  await db.collection("picks").doc(docId).set({
    playerId: state.playerId,
    week,
    gameId: game.id,
    teamAbbr: team.abbr,
    oppAbbr: opp.abbr,
    gameDate: game.date,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  toast(`Locked in: ${team.name} to lose in Week ${week}.`);
}

// --- Rendering ---

function render() {
  updateWeekTabIcons();
  const content = document.getElementById("content");
  if (state.activeView === "home") return renderHome(content);
  if (state.activeView === "entries") return renderEntries(content);
  if (state.activeView === "standings") return renderStandings(content);
  if (state.activeView === "admin") return renderAdmin(content);
}

async function adminDeletePlayer(playerId, name) {
  if (!confirm(`Remove ${name} from the pool? Their pick history stays in Firestore but they'll drop off Standings.`)) return;
  try {
    await db.collection("players").doc(playerId).delete();
    toast(`Removed ${name}.`);
  } catch (e) {
    toast(e.message);
  }
}

async function adminSetPick(playerId, week, gameId, teamAbbr) {
  const games = state.weekCache[week];
  const game = games && games.find(g => g.id === gameId);
  if (!game) return;
  const team = game.home.abbr === teamAbbr ? game.home : game.away;
  const opp = game.home.abbr === teamAbbr ? game.away : game.home;
  try {
    await db.collection("picks").doc(`${playerId}_${week}`).set({
      playerId, week, gameId, teamAbbr, oppAbbr: opp.abbr, gameDate: game.date,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(`Set to ${team.name} to lose.`);
  } catch (e) {
    toast(e.message);
  }
}

async function adminClearPick(playerId, week) {
  try {
    await db.collection("picks").doc(`${playerId}_${week}`).delete();
    toast("Pick cleared.");
  } catch (e) {
    toast(e.message);
  }
}

async function adminEditOdds(week, awayAbbr, homeAbbr, awayName, homeName) {
  const key = `${week}_${awayAbbr}_${homeAbbr}`;
  const current = state.allOdds[key] || FALLBACK_ODDS[key] || {};

  const awaySpread = prompt(`${awayName} spread (e.g. +3 (-105)):`, current.awaySpread || "");
  if (awaySpread === null) return;
  const awayML = prompt(`${awayName} moneyline (e.g. +153):`, current.awayML || "");
  if (awayML === null) return;
  const homeSpread = prompt(`${homeName} spread (e.g. -3 (-115)):`, current.homeSpread || "");
  if (homeSpread === null) return;
  const homeML = prompt(`${homeName} moneyline (e.g. -175):`, current.homeML || "");
  if (homeML === null) return;

  try {
    await db.collection("odds").doc(key).set({ awaySpread, awayML, homeSpread, homeML });
    toast("Odds saved.");
  } catch (e) {
    toast(e.message);
  }
}

function renderAdmin(content) {
  if (!isAdmin()) { content.innerHTML = '<div class="hint">Not authorized.</div>'; return; }

  const week = state.activeWeek;
  const games = state.weekCache[week] || [];

  const gameOptions = (currentGameId, currentTeamAbbr) => games.map(g => `
    <option value="${g.id}|${g.away.abbr}" ${g.id === currentGameId && g.away.abbr === currentTeamAbbr ? "selected" : ""}>${g.away.name} (@ ${g.home.name})</option>
    <option value="${g.id}|${g.home.abbr}" ${g.id === currentGameId && g.home.abbr === currentTeamAbbr ? "selected" : ""}>${g.home.name} (vs ${g.away.name})</option>
  `).join("");

  content.innerHTML = `
    <div class="section-title">Current week</div>
    <div class="standings-row">
      <div class="standings-pick">ESPN auto-detected: Week ${state.espnWeek}${state.weekOverride ? ` — currently overridden to Week ${state.weekOverride}` : " (no override set)"}</div>
      <div class="admin-controls">
        <input id="weekOverrideInput" type="number" min="1" max="${TOTAL_WEEKS}" placeholder="e.g. 3" class="auth-input" style="width:90px" value="${state.weekOverride || ""}" />
        <button id="saveWeekOverrideBtn" class="btn-primary">Set override</button>
        ${state.weekOverride ? '<button id="clearWeekOverrideBtn" class="btn-ghost">Clear override</button>' : ""}
      </div>
    </div>

    <div class="section-title">Players</div>
    ${state.players.map(p => `
      <div class="standings-row">
        <div class="standings-main">
          <div class="standings-name">${p.name}</div>
          <button class="btn-ghost" data-delete-player="${p.id}" data-name="${p.name}">Remove</button>
        </div>
      </div>`).join("") || '<div class="hint">No players yet.</div>'}

    <div class="section-title">Picks — Week ${week}</div>
    ${state.players.map(p => {
      const pick = getPick(p.id, week);
      return `
      <div class="standings-row">
        <div class="standings-main">
          <div class="standings-name">${p.name}</div>
        </div>
        <div class="admin-controls">
          <select class="auth-input" data-pick-select="${p.id}">
            <option value="">— no pick —</option>
            ${gameOptions(pick && pick.gameId, pick && pick.teamAbbr)}
          </select>
          <button class="btn-primary" data-set-pick="${p.id}">Set</button>
          ${pick ? `<button class="btn-ghost" data-clear-pick="${p.id}">Clear</button>` : ""}
        </div>
      </div>`;
    }).join("") || '<div class="hint">No players yet.</div>'}

    <div class="section-title">Odds — Week ${week}</div>
    ${games.map(g => `
      <div class="standings-row">
        <div class="standings-main">
          <div class="standings-name">${g.away.name} @ ${g.home.name}</div>
          <button class="btn-ghost" data-edit-odds-game="${g.id}">${getOdds(week, g.away.abbr, g.home.abbr) ? "Edit odds" : "+ Add odds"}</button>
        </div>
      </div>`).join("") || '<div class="hint">No games loaded for this week.</div>'}
  `;

  document.getElementById("saveWeekOverrideBtn").addEventListener("click", async () => {
    const val = parseInt(document.getElementById("weekOverrideInput").value, 10);
    if (!val || val < 1 || val > TOTAL_WEEKS) { toast("Enter a week number between 1 and " + TOTAL_WEEKS); return; }
    try {
      await db.collection("config").doc("app").set({ currentWeekOverride: val });
      toast(`Current week overridden to Week ${val}.`);
    } catch (e) {
      toast(e.message);
    }
  });

  const clearWeekBtn = document.getElementById("clearWeekOverrideBtn");
  if (clearWeekBtn) {
    clearWeekBtn.addEventListener("click", async () => {
      try {
        await db.collection("config").doc("app").set({ currentWeekOverride: null });
        toast("Override cleared — back to ESPN auto-detection.");
      } catch (e) {
        toast(e.message);
      }
    });
  }

  content.querySelectorAll("[data-delete-player]").forEach(btn => {
    btn.addEventListener("click", () => adminDeletePlayer(btn.dataset.deletePlayer, btn.dataset.name));
  });

  content.querySelectorAll("[data-set-pick]").forEach(btn => {
    btn.addEventListener("click", () => {
      const select = content.querySelector(`[data-pick-select="${btn.dataset.setPick}"]`);
      if (!select.value) { toast("Choose a team first."); return; }
      const [gameId, teamAbbr] = select.value.split("|");
      adminSetPick(btn.dataset.setPick, week, gameId, teamAbbr);
    });
  });

  content.querySelectorAll("[data-clear-pick]").forEach(btn => {
    btn.addEventListener("click", () => adminClearPick(btn.dataset.clearPick, week));
  });

  content.querySelectorAll("[data-edit-odds-game]").forEach(btn => {
    btn.addEventListener("click", () => {
      const game = games.find(g => g.id === btn.dataset.editOddsGame);
      adminEditOdds(week, game.away.abbr, game.home.abbr, game.away.name, game.home.name);
    });
  });
}

function renderHome(content) {
  const week = state.activeWeek;
  const games = state.weekCache[week];
  if (!games) { content.innerHTML = '<div class="hint">Loading matchups…</div>'; return; }
  if (!games.length) { content.innerHTML = '<div class="hint">No games found for this week.</div>'; return; }

  const isCurrentWeek = week === state.currentWeek;
  const myPick = state.playerId ? getPick(state.playerId, week) : null;
  const myUsed = state.playerId ? usedTeams(state.playerId, week) : new Set();
  const myStatus = state.playerId ? computePlayerStatus(state.playerId) : null;

  const banner = myStatus && myStatus.eliminated
    ? `<div class="eliminated-banner">❌ You were eliminated in Week ${myStatus.eliminatedWeek} — no more picks this season.</div>`
    : "";

  content.innerHTML = banner + games.map(g => renderMatchup(g, week, isCurrentWeek, myPick, myUsed, myStatus)).join("");

  content.querySelectorAll("[data-pick]").forEach(row => {
    row.addEventListener("click", () => {
      const gameId = row.dataset.gameId;
      const teamAbbr = row.dataset.pick;
      const game = games.find(g => g.id === gameId);
      const team = game.home.abbr === teamAbbr ? game.home : game.away;
      makePick(week, game, team);
    });
  });

}

function renderMatchup(g, week, isCurrentWeek, myPick, myUsed, myStatus) {
  const started = new Date(g.date) <= new Date();
  const eliminated = !!(myStatus && myStatus.eliminated);
  const canPick = isCurrentWeek && !started && state.playerId && !eliminated;
  const odds = getOdds(week, g.away.abbr, g.home.abbr);

  const rowHtml = (team, opp, isAway) => {
    const isMyPick = myPick && myPick.gameId === g.id && myPick.teamAbbr === team.abbr;
    const alreadyUsed = myUsed.has(team.abbr) && !isMyPick;
    const pickable = canPick && !alreadyUsed;
    const classes = ["matchup-row"];
    if (pickable) classes.push("pickable");
    if (!pickable) classes.push("disabled");
    if (isMyPick) {
      // Red while pending or wrong (team won/tied), green once confirmed correct (team lost).
      classes.push(g.completed ? (team.winner === false ? "picked-safe" : "picked-lose") : "picked-lose");
    }

    let badge = "";
    if (isMyPick) {
      let label = started ? "Pick Locked" : "Picked to Lose";
      if (g.completed) label = team.winner === false ? "Correct — Safe" : "Wrong — Eliminated";
      badge = `<div class="pick-badge ${started ? "locked" : ""} ${g.completed && team.winner === false ? "safe" : ""}">${label} · Week ${week}</div>`;
    } else if (alreadyUsed) badge = `<div class="used-chip" style="margin-top:2px;display:inline-block;">Already used</div>`;

    // Reveal who picked this team only once the game has locked (kickoff passed) — keeps picks secret beforehand.
    let pickedByHtml = "";
    if (started) {
      const names = playersWhoPicked(week, g.id, team.abbr);
      if (names.length) {
        pickedByHtml = `<div class="used-teams"><span class="used-chip">Picked by: ${names.join(", ")}</span></div>`;
      }
    }

    let oddsHtml = "";
    if (odds) {
      const spread = isAway ? odds.awaySpread : odds.homeSpread;
      const ml = isAway ? odds.awayML : odds.homeML;
      if (spread || ml) {
        oddsHtml = `<div class="odds-line">${spread ? `<span>Spread ${spread}</span>` : ""}${ml ? `<span>ML ${ml}</span>` : ""}</div>`;
      }
    }

    return `
      <div class="${classes.join(" ")}" ${pickable ? `data-pick="${team.abbr}" data-game-id="${g.id}"` : ""}>
        <img class="team-logo" src="${team.logo}" alt="${team.name}" />
        <div class="team-info">
          <div class="team-name">${team.name}</div>
          <div class="team-sub">${team.record}</div>
          ${oddsHtml}
          ${badge}
          ${pickedByHtml}
        </div>
        ${team.score !== null ? `<div class="team-score">${team.score}</div>` : ""}
      </div>`;
  };

  return `
    <div class="matchup">
      <div class="matchup-meta">
        <span>${new Date(g.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
        ${g.completed || started ? `<span>${g.completed ? "Final" : g.statusText}</span>` : ""}
      </div>
      ${rowHtml(g.away, g.home, true)}
      ${rowHtml(g.home, g.away, false)}
    </div>`;
}

function renderEntries(content) {
  if (!state.playerId) { content.innerHTML = '<div class="hint">Log in to see your entry.</div>'; return; }
  const player = state.players.find(p => p.id === state.playerId);
  const status = computePlayerStatus(state.playerId);

  let rows = "";
  for (let w = 1; w <= state.currentWeek; w++) {
    const pick = getPick(state.playerId, w);
    const games = state.weekCache[w];
    let line = `Week ${w}: `;
    if (!pick) { line += "No pick"; }
    else {
      const game = games && games.find(g => g.id === pick.gameId);
      const teamName = game ? (game.home.abbr === pick.teamAbbr ? game.home.name : game.away.name) : pick.teamAbbr;
      line += `${teamName} to lose`;
      if (game && game.completed) {
        const team = game.home.abbr === pick.teamAbbr ? game.home : game.away;
        line += team.winner === true ? " — WON (eliminated)" : team.winner === false ? " — Lost ✔" : " — Tie (safe)";
      }
    }
    rows += `<div class="standings-row"><div class="standings-name">${line}</div></div>`;
  }

  content.innerHTML = `
    <div class="section-title">${player ? player.name : ""}'s Entry</div>
    <div class="standings-row">
      <div class="standings-name">${status.eliminated ? `❌ Eliminated (Week ${status.eliminatedWeek})` : "✅ Still alive"}</div>
      <div class="record">${status.wins}-${status.losses}</div>
    </div>
    <div class="section-title">Pick History</div>
    ${rows}`;
}

// This week's pick, shown only once locked (that game has kicked off) — never before,
// so nobody can see (and copy) another player's pick while it's still changeable.
function currentWeekPickLine(playerId) {
  const week = state.currentWeek;
  const pick = getPick(playerId, week);
  if (!pick) return null;

  const games = state.weekCache[week];
  const game = games && games.find(g => g.id === pick.gameId);
  if (!game) return null;

  const locked = new Date(game.date) <= new Date();
  if (!locked) return null;

  const team = game.home.abbr === pick.teamAbbr ? game.home : game.away;
  let mark = "";
  if (game.completed) mark = team.winner === false ? " ✔" : " ✗"; // win or tie for the picked team = miss

  return `Week ${week} pick: ${team.name}${mark}`;
}

function renderStandings(content) {
  const rows = state.players.map(p => {
    const status = computePlayerStatus(p.id);
    return { ...p, ...status, pickLine: currentWeekPickLine(p.id) };
  }).sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return (b.wins - b.losses) - (a.wins - a.losses);
  });

  content.innerHTML = `
    <div class="section-title">Standings — Week ${state.currentWeek}</div>
    ${rows.map(p => `
      <div class="standings-row ${p.eliminated ? "standings-row-eliminated" : ""}">
        <div class="standings-main">
          <div class="standings-name">${p.name}</div>
          <div class="${p.eliminated ? "status-dead" : "status-alive"}">${p.eliminated ? "Eliminated" : "Alive"}</div>
          <div class="record">${p.wins}-${p.losses}</div>
        </div>
        ${p.pickLine ? `<div class="standings-pick">${p.pickLine}</div>` : ""}
      </div>`).join("")}`;
}

init();
