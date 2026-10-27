# monkeypref

Live at https://monkeypref.netlify.app/ — sibling of [monkeyspread](https://monkeyspread.netlify.app/).

Read every paradigm in a Tabroom judge pool on one page, sort it like Tabroom does, and check judges off as you pref them.

## Host it
It's a single static `index.html` — drop this folder (or the zip) onto Netlify Drop, GitHub Pages, etc.
It has to be hosted (not opened as a local file) for the bookmark to hand data to it.

## Use it
1. Open the hosted page and drag the **monkeypref** button to your bookmarks bar.
2. Log in to Tabroom and open a tournament's **Judges** list for your event.
3. Click the bookmark. It reads each judge's paradigm with your own logged-in session and opens them in monkeypref.

Re-run the bookmark on the same pool to refresh paradigms; checkmarks are kept.

## Keys
- `n` — jump to the next unpreffed judge (expands it)
- `x` — toggle preffed on the focused judge
- `/` — search names, schools and paradigm text

Everything is stored in your browser's localStorage. Export a pool as `.json` to share it with teammates (they can import it without a Tabroom login), or as `.csv`.
