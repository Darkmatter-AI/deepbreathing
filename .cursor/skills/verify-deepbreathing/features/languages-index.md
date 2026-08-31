# Languages index

Languages page lists 6 supported locales and links to key pages in each language. This is a static navigation surface with server-rendered content.

## Sub-features

- List of supported locales with native names
- Links to key pages per locale
- Back-to-home link

## How to get to it (user POV)

- Open `/languages`

## Driving it with Playwright

Preconditions:

- Local instance launched via this skill on `http://localhost:4317/`

- Basic presence assertions (example one-liners):
  - `node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:4317/languages');await p.getByRole('heading', {name:/Available in 6 languages/i}).waitFor();await b.close();})"`

## Gotchas

- In proxy i18n mode, locale prefixes are stripped for top-level English routes; `/languages` is the canonical URL
