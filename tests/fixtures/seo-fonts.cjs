// Offline build verification only; never used by application configuration.
// Keys must match the Google Fonts URLs that next/font requests for app/layout.tsx.
module.exports = {
  'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&display=swap': "@font-face { font-family: 'Instrument Sans'; font-style: normal; font-weight: 400 700; src: url(https://offline.invalid/instrument-sans.woff2) format('woff2'); }",
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@200..800&display=swap': "@font-face { font-family: 'Bricolage Grotesque'; font-style: normal; font-weight: 200 800; src: url(https://offline.invalid/bricolage-grotesque.woff2) format('woff2'); }",
}
