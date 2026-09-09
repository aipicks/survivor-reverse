// Thin wrapper around ESPN's public (unofficial, unauthenticated) NFL scoreboard endpoint.
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

async function fetchCurrentWeekInfo() {
  const res = await fetch(ESPN_BASE);
  const data = await res.json();
  return { week: data.week.number, year: data.season.year, seasontype: data.season.type };
}

async function fetchWeek(week, year, seasontype = 2) {
  const url = `${ESPN_BASE}?week=${week}&seasontype=${seasontype}&year=${year}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.events || []).map(parseEvent);
}

function parseEvent(event) {
  const comp = event.competitions[0];
  const [a, b] = comp.competitors;
  // ESPN orders competitors home/away via homeAway field, not array position.
  const home = comp.competitors.find(c => c.homeAway === "home") || a;
  const away = comp.competitors.find(c => c.homeAway === "away") || b;
  const completed = comp.status.type.completed;

  const toTeam = (c) => ({
    abbr: c.team.abbreviation,
    name: c.team.shortDisplayName || c.team.name,
    logo: c.team.logo,
    score: c.score != null ? Number(c.score) : null,
    winner: completed ? !!c.winner : null,
    record: (c.records && c.records[0] && c.records[0].summary) || ""
  });

  return {
    id: event.id,
    date: comp.date, // ISO string
    completed,
    statusText: comp.status.type.shortDetail,
    home: toTeam(home),
    away: toTeam(away)
  };
}
