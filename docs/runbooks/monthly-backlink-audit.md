# Monthly backlink audit — deepbreathingexercises.com

Catches new spam waves before they hurt the domain. Runs on the 1st of each month
via `deepbreathing-monthly-backlink-audit` scheduled task; can also be run manually.

## Why this exists

DBE got hit by negative-SEO / organic spam in Jan 2026 (Chinese cluster) and Apr-May
2026 (`.shop` cluster). Abi has NOT bought any SEO services — these waves are
unsolicited. The DR slid from ~8 to 4.3 before the May 5 disavow. This audit catches
the next wave early.

## Reference paths

- Audit log to append: `/Users/abi/Sites/darkmatter/DarkmatterOS/Darkmatter Engineer/docs/backlink-audit-log.md`
- Current disavow file (or latest dated): `/Users/abi/Sites/darkmatter/DarkmatterOS/Darkmatter Engineer/data/dbe-disavow-2026-05-05.txt`
- GSC disavow URL: https://search.google.com/search-console/disavow-links (URL-prefix property only — pick `https://deepbreathingexercises.com/`, NOT the Domain property which is "not supported")
- Ahrefs ref-domains URL: https://app.ahrefs.com/site-explorer/refdomains (sort by DR desc, look for SPAM tags)

## Procedure

### 1. Pull current Ahrefs ref-domain snapshot

Use Chrome MCP (NOT the Ahrefs MCP — memory `feedback_ahrefs_browser_only.md` says
never use it). Navigate to the ref-domains page sorted by DR desc:

```
https://app.ahrefs.com/site-explorer/refdomains?target=deepbreathingexercises.com%2F&mode=subdomains&sort=Dr&sortDirection=desc&limit=50
```

Use `mcp__Claude_in_Chrome__get_page_text` to grab all 50 rows quickly. Then click
page 2 to grab the rest. Capture: domain name, DR, SPAM tag (if any), Status
(New/Lost/blank), First seen date.

### 2. Diff against last snapshot

Read the last entry in `docs/backlink-audit-log.md`. Compare:

- **Total ref-domain count** delta
- **DR** delta
- **New spam-tagged domains** since last audit — the critical signal
- **New "Status: New" domains** flagged by Ahrefs in the last 30 days that match
  spam patterns: any of `.shop`, `.xyz`, `.click`, `.icu`, `.life`, `.one`, `.cc`,
  `.agency`, `.sale`, `.space`, `.online`, `.site`, `.website`, or randomly-generated
  subdomains, or DR > 35 with 0 traffic and 0 keywords (= classic PBN signature)

### 3. Check GSC disavow is still applied

Navigate https://search.google.com/search-console/disavow-links → select
`https://deepbreathingexercises.com/` (URL-prefix, not Domain). Confirm the disavow
file is still there and the domain count is what you expect. If it shows
"Cancel disavowals" link, the file is active.

Also: navigate https://search.google.com/search-console/manual-actions?resource_id=https%3A%2F%2Fdeepbreathingexercises.com%2F and confirm "No issues detected" or capture any manual action.

### 4. If new spam detected — build merged disavow + upload via DataTransfer trick

Build the new merged disavow file (preserve existing entries + add new ones). Save
to `data/dbe-disavow-YYYY-MM-DD.txt` (today's date).

To upload to GSC, use this JS DataTransfer trick (Chrome MCP `file_upload` returns
"Not allowed" on GSC, so DataTransfer is the workaround — see
`reference_seo_disavow_workflow.md` in memory):

1. Click "Replace" button (outer)
2. Click "Replace" in the dialog (this opens the OS file picker — ignore it)
3. Run JS via `mcp__Claude_in_Chrome__javascript_tool`:

```js
const b64 = "<base64-encoded-file-contents>";
const bin = atob(b64);
const bytes = new Uint8Array(bin.length);
for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
const file = new File([bytes], 'disavow.txt', {type: 'text/plain'});
const input = document.querySelector('input[type="file"]');
const dt = new DataTransfer(); dt.items.add(file);
input.files = dt.files;
input.dispatchEvent(new Event('change', {bubbles: true}));
```

4. Wait ~3s. Confirm new domain count appears.

If you find new spam but want human approval before uploading, write the merged
disavow but DO NOT upload — leave a note in the audit log entry instead and notify Abi.

### 5. Append to the audit log

Append to `docs/backlink-audit-log.md`:

```
## YYYY-MM-DD audit
- Ref domains: <count> (Δ <delta> vs last)
- DR: <value> (Δ <delta>)
- New since last audit: <list, or "none">
- Spam wave detected: <yes/no — if yes, describe pattern>
- Action taken: <none / "added N domains to disavow, uploaded to GSC" / "flagged for review">
- GSC manual actions: <none / details>
- Disavow file in use: data/dbe-disavow-YYYY-MM-DD.txt with <count> domains
```

Commit the log update with message `chore(seo): monthly backlink audit YYYY-MM-DD`
and push only if Abi approves.

### 6. Skip Bing disavow — but skim the report

Bing retired its disavow tool in October 2023. They auto-detect spam now. Do NOT try
to upload anywhere on Bing — but DO skim the Bing Backlinks report at
https://www.bing.com/webmasters/backlinks?siteUrl=https://deepbreathingexercises.com/
as a sanity check. If Bing's referring-domain count has spiked or is showing a lot
of new spam-pattern domains, note in the log.

## Output format

End the run with a 1-line Slack-style summary that Abi can read at a glance:

- ✅ Clean — no new spam
- ⚠️ N new spam domains detected, queued for disavow (see log)
- 🚨 N new spam domains + manual action / DR drop > 2 — needs immediate attention
