# lumystudios.github.io

Public website for Lumy Studios apps, served by GitHub Pages at https://lumystudios.github.io/.
This is the one intentionally public repo in the org: it only holds pages that must be public.

| Path | Purpose |
|---|---|
| `/` | Studio home page |
| `/pencilpop/` | PencilPop app page and support (App Store "Support URL": `/pencilpop/#support`) |
| `/pencilpop/privacy/` | PencilPop privacy policy (App Store "Privacy Policy URL" and the app's `PRIVACY_POLICY_URL`) |
| `/reverie/`, `/reverie/privacy/` | Reverie app page, support and privacy policy |
| `/littlewonders/` | Little Wonders app page and support (App Store "Support URL"; the app's `LWSupportURL`) |
| `/littlewonders/privacy/` | Little Wonders privacy policy (App Store "Privacy Policy URL"; the app's `LWPrivacyPolicyURL`) |
| `/starling/`, `/starling/privacy/` | Starling (Mac) app page, support and privacy policy |
| `/privacy/` | Website privacy policy (no cookies, analytics or tracking) |
| `/terms/` | Terms of use for the site and apps (points to Apple's standard EULA) |
| `/legal/` | Legal notice (operator, contact) and `#accessibility` statement |
| `/404.html` | Not-found page; root-absolute links because Pages serves it at any path |
| `/app-ads.txt` | AdMob authorized sellers; needs this site set as the developer website in App Store Connect |

Plain HTML and CSS, no build step. Edit the files and push to `main`; Pages updates in about a minute.
Never put secrets or private data here.

## Design and motion

- `assets/site.css` styles every page. Home-only parts are under the "Home" comment. Each app has a color "world" (`--pp-*`, `--rv-*`, `--lw-*`, `--st-*`) taken from its art.
- `assets/home.js` (home page only) draws the logo's ribbon: a curl in the hero on load, then a line that draws down the left edge as you scroll and passes behind each app icon. It uses GSAP (ScrollTrigger, SplitText, DrawSVG) and Lenis smooth scroll, and it honors reduced motion. The page is complete without JavaScript.
- Everything is self-hosted (`assets/vendor/`, `assets/fonts/`, licenses in `assets/vendor/LICENSES.md`). Don't add CDN scripts, Google Fonts links, analytics or cookies; the website privacy policy promises none.
- After changing `site.css` or `home.js`, bump the `?v=` number where they're linked so returning visitors get the new file.
- New app: add a `.world` section on the home page with a `.world-icon` (the ribbon finds it automatically), a row in the "at a glance" table, and links in the footer (also in the footers of the other pages).
