# MyTools

Kolekcia 21 IT/web nástrojov (IP kalkulačka, JSON formatter, JWT decoder, generátor hesiel, QR generátor, DNS lookup a ďalšie) na jednom mieste. Bez registrácie, bez trackingu, bez databázy.

## Technológie

- **Statický web**: čisté HTML5 + CSS3 + vanilla JavaScript. Žiadny framework, žiadny build krok.
- **Server-side časti**: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) (JavaScript, beží na Workers runtime) — iba pre **DNS Lookup** a **HTTP Headers Checker**, keďže browser nevie robiť raw DNS dotazy ani čítať cross-origin response headers.
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
├── wrangler.toml                Voliteľná konfigurácia pre Wrangler CLI / KV binding
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
└── functions/
    ├── _utils.js                 Zdieľané helpery (JSON response, rate limiting, timeout)
    └── api/
        ├── dns.js                 GET /api/dns?domain=... (DNS-over-HTTPS lookup)
        └── http-headers.js        GET /api/http-headers?url=... (SSRF-safe HTTP header checker)
```

## Pred nasadením: nahraď placeholder doménu

Všetky `canonical`/`og:url` meta tagy, `sitemap.xml` a `robots.txt` používajú placeholder doménu `https://mytools.pages.dev`. Po nasadení ju nahraď svojou skutočnou doménou (Pages subdoménou alebo vlastnou doménou):

```bash
grep -rl "mytools.pages.dev" . --include="*.html" --include="*.xml" --include="*.txt" | \
  xargs sed -i '' 's/mytools\.pages\.dev/tvoja-domena.sk/g'
```

(Na Linuxi/CI vynechaj `''` po `-i`.)

## Lokálny vývoj

Statické stránky si vieš pozrieť akýmkoľvek statickým serverom (napr. `python3 -m http.server`), ale `/api/dns` a `/api/http-headers` takto fungovať nebudú — tie potrebujú Workers runtime. Na plné lokálne testovanie vrátane Functions nainštaluj [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
npm install -g wrangler
wrangler pages dev .
```

Toto spustí celý web (statické súbory aj `/api/*` funkcie) lokálne na `http://localhost:8788`.

## Nasadenie na Cloudflare Pages

### Možnosť A — cez Git (odporúčané)

1. Nahraj tento priečinok do vlastného Git repozitára (GitHub/GitLab).
2. V [Cloudflare dashboarde](https://dash.cloudflare.com/) choď na **Workers & Pages → Create → Pages → Connect to Git**.
3. Vyber repozitár.
4. Build nastavenia:
   - **Framework preset**: None
   - **Build command**: (nechaj prázdne — nie je potrebný žiadny build)
   - **Build output directory**: `/`
5. Klikni **Save and Deploy**. Cloudflare automaticky rozpozná priečinok `functions/` a nasadí ho ako Pages Functions.

### Možnosť B — priamy upload cez Wrangler CLI (bez Git, bez SSH)

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=mytools
```

## Čo nastaviť po nasadení

1. **Vlastná doména**: Workers & Pages → tvoj projekt → **Custom domains** → pridaj doménu. Cloudflare automaticky vystaví a obnovuje HTTPS certifikát — nič ďalšie netreba nastavovať, žiadne manuálne Let's Encrypt kroky.
2. **Rate limiting (voliteľné, ale odporúčané)**:
   - Najjednoduchšie: v dashboarde nastav **Security → Rate Limiting Rules** pre cesty `/api/dns` a `/api/http-headers` (napr. max 20 requestov/min na IP). Toto funguje bez akýchkoľvek zmien v kóde.
   - Dodatočne (defense-in-depth): kód v `functions/_utils.js` obsahuje aj vlastný rate limiter cez KV namespace. Ak ho chceš zapnúť:
     ```bash
     wrangler kv namespace create RATE_LIMIT_KV
     ```
     Vypísané `id` vlož do `wrangler.toml` (odkomentuj sekciu `[[kv_namespaces]]`) alebo priraď binding `RATE_LIMIT_KV` v dashboarde (**Settings → Functions → KV namespace bindings**). Bez tohto bindingu appka funguje normálne ďalej, len bez vlastného rate-limitu na strane kódu.
3. **Overenie bezpečnostných hlavičiek**: po nasadení skontroluj cez `curl -I https://tvoja-domena.sk/`, že sú prítomné `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security` (definované v súbore `_headers`).
4. **Cron**: projekt žiadny cron/scheduled job nepotrebuje — nič netreba nastavovať.

## Testovací checklist

- [ ] Homepage sa načíta, dark mode je predvolený, prepínač na light mode funguje a ukladá sa (localStorage)
- [ ] Globálny search v hlavičke aj na `/tools/` filtruje naživo
- [ ] Všetkých 21 nástrojov sa otvorí a základná funkcia (výpočet/konverzia/generovanie) prejde bez chyby v konzole
- [ ] `/tools/dns-lookup/` a `/tools/http-headers/` vrátia výsledok (funguje iba po nasadení na Cloudflare alebo cez `wrangler pages dev`, nie na statickom file serveri)
- [ ] Skús `http://localhost/` alebo privátnu IP (`10.0.0.1`) v HTTP Headers Checkeri → musí sa zamietnuť s chybovou hláškou (SSRF ochrana)
- [ ] Mobilné zobrazenie (≤480px): hamburger menu, jednostĺpcový layout, žiadny horizontálny scroll
- [ ] `/404` na neexistujúcej ceste zobrazí vlastnú 404 stránku
- [ ] `robots.txt` a `sitemap.xml` sú dostupné a obsahujú správnu (nie placeholder) doménu

## Bezpečnostné poznámky

- **SSRF ochrana** (`functions/api/http-headers.js`): blokuje `localhost`, privátne/rezervované IPv4 aj IPv6 rozsahy, non-http(s) schémy, a pred každým redirect hopom znova validuje cieľ. DNS rebinding TOCTOU medzera je zdokumentovaná priamo v kóde — ide o platformové obmedzenie Workers runtime (fetch si DNS rozlišuje sám), nie chybu; preto sa odporúča mať zapnuté aj Cloudflare Rate Limiting Rules ako ďalšiu vrstvu.
- **CSP**: `script-src`/`style-src` obsahujú `'unsafe-inline'`, keďže stránky používajú malé inline `<script>` bloky (theme init, related-tools rendering) bez build kroku, ktorý by umožnil per-request nonce. Všetok user-controlled text sa pred vložením do DOM escapuje (`mtEscapeHtml`), takže reziduálne riziko je nízke, ale je to vedomý kompromis.
- **MD5/SHA-1** v Hash Generátore sú viditeľne označené ako kryptograficky prekonané.
- **JWT Decoder** nikdy netvrdí, že podpis je overený — iba dekóduje.

## Licencie tretích strán

- `assets/js/vendor/qrcode.js` — QR Code Generator for JavaScript, © Kazuhiko Arase, [MIT license](https://opensource.org/licenses/mit-license.php).
