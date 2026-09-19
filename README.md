# MyTools

https://12367123.xyz

Kolekcia 21 IT/web nástrojov (IP kalkulačka, JSON formatter, JWT decoder, generátor hesiel, QR generátor, DNS lookup a ďalšie) na jednom mieste. Bez registrácie, bez trackingu, bez databázy.

## Technológie

- **Statický web**: čisté HTML5 + CSS3 + vanilla JavaScript. Žiadny framework, žiadny build krok.
- **Databáza**: žiadna. Žiadny nástroj ju reálne nepotrebuje.
- **Hosting**: Cloudflare Pages (nie klasický shared hosting s Apache/PHP — pôvodné zadanie počítalo s PHP, ale keďže cieľový hosting je Cloudflare Pages, ktorý PHP nespúšťa, celý backend je prepísaný do JS Workers funkcií).

## Štruktúra projektu

```
yap/
├── index.html                  Homepage
├── 404.html                    Vlastná 404 stránka
├── robots.txt
├── sitemap.xml
├── _headers                    Bezpečnostné HTTP hlavičky (CSP, HSTS, ...) pre Cloudflare Pages
├── favicon.svg
├── wrangler.toml.example        Voliteľná konfigurácia pre lokálny Wrangler CLI / KV binding (pozri nižšie)
├── assets/
│   ├── css/style.css            Celý dizajnový systém (dark/light mode)
│   └── js/
│       ├── app.js               Theme toggle, mobilné menu, globálny search, copy/toast utility
│       ├── icons.js             Sada inline SVG ikon
│       ├── tools-data.js        Centrálny registry všetkých nástrojov (jediný zdroj pravdy)
│       ├── vendor/qrcode.js      Vendorovaná MIT licencovaná QR knižnica (kazuhikoarase/qrcode-generator), načítaná lokálne
│       └── tools/*.js            Logika jednotlivých nástrojov (1 súbor na nástroj)
├── tools/
│   ├── index.html                Zoznam všetkých nástrojov + filter podľa kategórie
│   └── <nazov-nastroja>/index.html   21 samostatných stránok nástrojov
├── about/index.html
├── privacy/index.html
├── admin/index.html              Password-gated dočasné zdieľanie súborov (noindex, nie je v nav/search)
└── functions/
    ├── _utils.js                 Zdieľané helpery (JSON response, rate limiting, timeout)
    ├── _auth.js                  Bezstavová admin session (HMAC-podpísaný cookie, žiadna DB)
    ├── api/
    │   ├── dns.js                 GET /api/dns?domain=... (DNS-over-HTTPS lookup)
    │   ├── http-headers.js        GET /api/http-headers?url=... (SSRF-safe HTTP header checker)
    │   ├── admin-login.js         POST /api/admin-login (heslo → session cookie)
    │   ├── admin-logout.js        POST /api/admin-logout
    │   ├── admin-upload.js        POST /api/admin-upload (streamuje priamo do R2)
    │   ├── admin-files.js         GET /api/admin-files (zoznam + lazy mazanie expirovaných)
    │   └── admin-delete.js        POST /api/admin-delete
    └── s/
        └── [id].js                GET /s/:id — verejný (bez hesla) download/preview odkaz
```

## Lokálny vývoj

Statické stránky si vieš pozrieť akýmkoľvek statickým serverom (napr. `python3 -m http.server`), ale `/api/dns` a `/api/http-headers` takto fungovať nebudú — tie potrebujú Workers runtime. Na plné lokálne testovanie vrátane Functions nainštaluj [Wrangler](https://developers.cloudflare.com/workers/wrangler/) a skopíruj si lokálnu (necommitovanú) konfiguráciu:

```bash
npm install -g wrangler
cp wrangler.toml.example wrangler.toml   # len lokálne, tento súbor sa necommituje
wrangler pages dev .
```

Toto spustí celý web (statické súbory aj `/api/*` funkcie) lokálne na `http://localhost:8788`.

> **Prečo `wrangler.toml.example`, nie `wrangler.toml`?** Ak je `wrangler.toml` prítomný v Git repozitári, ktorý je pripojený cez Cloudflare's Git integráciu, Cloudflare prepne build do režimu "Wrangler configuration file (BETA)" a spúšťa `wrangler pages deploy` priamo v CI — čo si vyžaduje vlastný `CLOUDFLARE_API_TOKEN` so správnymi právami a v praxi to vie zlyhávať na nedostatočne oprávnenom auto-generovanom tokene. Bez `wrangler.toml` v repozitári Cloudflare použije svoj štandardný (spoľahlivejší) statický Pages build, ktorý žiadny token ani wrangler nepotrebuje. Súbor `wrangler.toml.example` slúži iba ako predloha pre lokálny vývoj.


## Licencie tretích strán

- `assets/js/vendor/qrcode.js` — QR Code Generator for JavaScript, © Kazuhiko Arase, [MIT license](https://opensource.org/licenses/mit-license.php).
