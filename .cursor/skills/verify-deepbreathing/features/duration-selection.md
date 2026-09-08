# Duration selection

Before starting a session, users can pick a duration (30s, 1–10 min) from chips shown under the orb. The selected duration is reflected in the UI and encoded in the URL.

## Sub-features

- Duration chip selection (Open, 30s, 1–10 min options)
- URL param `?duration=` updated without page reload
- Selection persisted locally

## How to get to it (user POV)

- Open `/`, scroll below the orb, select a duration chip before starting

## Driving it with Playwright

Preconditions:

- Local instance launched via this skill on `http://localhost:4317/`

- Select a duration and verify:
  - `node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:4317/');await p.getByRole('button',{name:/1 min/i}).click();await p.waitForURL('**/?duration=*');console.log('url',p.url());await b.close();})"`
  - Observable result: the selected chip appears active; URL contains `?duration=60`

## Gotchas

- Chips are hidden during an active session; pause or reload to change duration
