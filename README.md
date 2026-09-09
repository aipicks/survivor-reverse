# Reverse Eliminator

Survivor/eliminator pool, flipped: each week you pick a team you think will **lose**. Guess wrong, or miss a week, and you're out. Can't reuse a team you've already picked.

Static site (no server) — Firestore holds the shared pick/odds data, Firebase Auth handles real accounts, ESPN's public scoreboard feed supplies schedules/scores/logos. Anyone can sign up with an email + password right on the site — signing up automatically enters you in the pool.

## 1. Create a Firebase project (free)

1. Go to https://console.firebase.google.com → **Add project** → give it any name → finish the wizard.
2. In the project, go to **Build → Firestore Database → Create database** → start in **production mode** → pick any region.
3. Go to **Build → Authentication → Get started** → under **Sign-in method**, enable **Email/Password**.
4. Go to **Project settings** (gear icon) → **General** → scroll to **Your apps** → click the `</>` (web) icon → register an app (no need for Firebase Hosting).
5. Copy the `firebaseConfig` object it gives you into [js/firebase-config.js](js/firebase-config.js), replacing the `REPLACE_ME` placeholders.

## 2. Set Firestore security rules

In Firestore → **Rules**, paste this and publish. Because real accounts exist now, these rules genuinely stop anyone from touching someone else's pick or player record — not just "please don't":

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if true;
      // You can only ever create/edit your own player doc, and only under your own account's uid.
      allow create, update: if request.auth != null && request.auth.uid == playerId;
      allow delete: if false;
    }
    match /picks/{pickId} {
      allow read: if true;
      // You can only write a pick that's recorded under your own uid.
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.playerId;
      allow delete: if false;
    }
    match /odds/{oddsId} {
      allow read: if true;
      allow create, update: if request.auth != null; // any signed-in player can enter/correct odds
      allow delete: if false;
    }
  }
}
```

That's it for setup — no manual player list to maintain. Whoever signs up on the site shows up automatically.

## 3. Run it locally

Just open `index.html` in a browser, or serve the folder with any static server, e.g.:

```bash
npx serve .
```

## 4. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Reverse Eliminator"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repo on GitHub: **Settings → Pages → Source: Deploy from branch → main / (root)**. Your site will be live at `https://<you>.github.io/<repo>/`.

## How the rules work in the app

- Each week, pick one team (from that week's games) that you think will **lose**.
- If they lose (or tie), you're safe and move on.
- If they win, or you don't submit a pick before your chosen game kicks off, you're eliminated.
- You can change your pick anytime before the specific game you picked has started; once it starts, it's locked.
- You can never pick the same team twice across the whole season.
- Standings and elimination status are computed live from ESPN's results — nothing to update by hand.
- Other players' picks stay hidden until their game kicks off, then reveal automatically.

## Odds (spread / moneyline)

Each matchup card has an **Edit odds** button — click it, type in the spread and moneyline for both teams (right off your sportsbook app), and it saves for everyone instantly via Firestore. No need to send screenshots each week; anyone in the group can enter that week's numbers directly. [js/app.js](js/app.js) also has a `FALLBACK_ODDS` block seeded with Week 1's numbers, used only until real odds are entered (or if Firebase isn't set up yet).

## Notes / things you may want to tweak

- `TOTAL_WEEKS` in [js/app.js](js/app.js) defaults to 18 (regular season). Adjust for playoffs if you want to keep it going.
- Current week is auto-detected from ESPN. If it's ever wrong (e.g. during the off-season), you can hardcode `state.currentWeek` in `init()` in [js/app.js](js/app.js).
- Team logos and scores come from ESPN's public scoreboard endpoint — no API key needed, but it's an unofficial/undocumented endpoint, so treat it as best-effort.
- `FALLBACK_PLAYERS` in [js/app.js](js/app.js) is only used before Firebase is configured (for local testing) — once real accounts exist, it's ignored.
