# SDA Kerk | sdakerk.com

A responsive, Afrikaans-first Seventh-day Adventist information website with an English switch, the supplied SDA logo, 28-belief overview, Bible reader, Sabbath School study directory, searchable Ellen G. White bookshelf, YouTube feed, map-based church finder and moderated church submissions, contact form, privacy policy and terms.

## Architecture

- **Deployment:** Vercel static HTML/CSS/JavaScript with Vercel Node serverless `/api/*` routes. No `npm install` or frontend build needed.
- **Routes:** Clean public URLs through `vercel.json` rewrites using extensionless destinations with `cleanUrls: true`, with individual HTML pages for indexability, descriptions, canonical tags, sitemap and robots.
- **Styles:** Pure CSS, responsive down to small phones. No gradients and no third-party component libraries.
- **Persistence:** Supabase PostgreSQL for approved churches and pending submissions. Local browser storage for language, cookie choice and book favourites.
- **Mail:** Resend for the contact form, sent to `hi@sdakerk.com`.
- **Maps:** Leaflet and OpenStreetMap tiles loaded when visitors open the church page. Device location is opt-in only and used in the browser for distance sorting. Map clicks set suggested pin coordinates.
- **Bible:** KJV via public `bible-api.com` through the `/api/bible` proxy; copyrighted editions through separately authorised API.Bible translation IDs, if configured. The UI never silently substitutes an English text for an Afrikaans translation. KJV supports a blank end-verse field for a full chapter. Selecting a verse synchronises highlighting and copying includes citations.
- **Study:** The current week's dates are displayed automatically with direct links to the official Afrikaans Sabbath School guide. Full texts are not mirrored without rights-holder consent.
- **Books:** Curated searchable English/Afrikaans bibliographic guide, a discreet category dropdown, favourites and official EGW Writings links. **The full official licensed catalogue and full-text reader remain at EGW Writings.** The Afrikaans display titles are guides and do not assert a translated edition exists for every work.
- **Videos:** YouTube Data API v3 loads recent channel uploads when `YOUTUBE_API_KEY` is set; title + description keyword search is local. Otherwise the official channel remains linked with a clear configuration notice.

## Deploy on GitHub + Vercel

1. Create a GitHub repository named `sdakerk-website` in your account (or another unique name).
2. Unzip this package, and push the **contents** of the directory to the GitHub repository's `main` branch.
3. In Vercel choose **Add New > Project**, import that GitHub repository, choose **Other** as framework, leave Build Command and Output Directory blank, and deploy. All root `.html` pages and `/api` functions deploy automatically.
4. Add the optional environment variables from `.env.example` in Vercel's **Project Settings > Environment Variables** for Production, Preview and Development as appropriate. Redeploy after changing variables.
5. For church persistence, create a Supabase project, execute `sql/supabase.sql` in its SQL Editor, and provide `SUPABASE_URL` and the **server-only** `SUPABASE_SERVICE_ROLE_KEY` to Vercel. Do not put the service-role key in the browser, the public Git repository, or any `NEXT_PUBLIC_` variable.
6. Review newly submitted churches in the Supabase Table Editor. Verify the church is an Afrikaans SDA congregation and check public contact details have consent. Set its `status` to `approved`. Only approved entries are returned by the public endpoint.
7. To send contact mail, verify the `sdakerk.com` sending domain in Resend (SPF and DKIM DNS records), set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`. Recipients are fixed to `hi@sdakerk.com` by the server.
8. Obtain a YouTube Data API v3 key in Google Cloud and set `YOUTUBE_API_KEY` to automatically show latest uploads from `@sdakerk`. Video metadata refreshes hourly.
9. To serve copyrighted Bible editions, obtain an approved provider licence and configure `BIBLE_API_KEY` plus its corresponding `BIBLE_ID_*` values. Names appearing in the dropdown **do not imply access**. Bible copyright permissions must be obtained from the actual publishers.
10. In Vercel's Domain Settings, add `sdakerk.com` and `www.sdakerk.com`. Configure the DNS records exactly as Vercel displays for your project. Set one as the canonical domain and redirect the other.

## Run locally

### Frontend-only preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080/`. For non-root pages during this preview use `/about.html`, `/bible.html`, etc. The static-only preview does not serve `/api/*`, so backend features require Vercel development or deployment.

### Full Vercel local runtime

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel dev
```

A Vercel local runtime or deployed project is necessary for serverless functions. `npm run check` verifies JavaScript syntax without dependencies.

## Pages

| Public URL | Source |
|---|---|
| `/` | `index.html` |
| `/oor-ons` | `about.html` |
| `/bybel` | `bible.html` |
| `/studie` | `study.html` |
| `/boeke` | `books.html` |
| `/videos` | `videos.html` |
| `/gemeentes` | `churches.html` |
| `/kontak` | `contact.html` |
| `/privaatheid` | `privacy.html` |
| `/bepalings` | `terms.html` |

## Rights and source links

- Official SDA beliefs: <https://adventist.org/en/beliefs>
- Afrikaans Sabbath School: <https://absg.sspmadventist.org/lang/af>
- Ellen White collection: <https://m.egwwritings.org/af/folders/1375>
- Bible Society SA copyright: <https://biblesociety.co.za/af/tuis/kopiereg-en-toestemmings/>
- EGW Writings copyright: <https://text.egwwritings.org/legal-copyright-notice>
- YouTube: <https://www.youtube.com/@sdakerk>

No claims of public-domain status are made for copyrighted Afrikaans Bibles, lesson content, or EGW Writings digital collection. No fabricated church entries, video thumbnails, or translation text are seeded. The site is not presented as an official denominational headquarters website.

## Production considerations

Before public launch, add rate limiting or CAPTCHA to public POST endpoints to reduce spam; consider an audit trail for approval/rejection, a staff-only admin interface, and policies covering POPIA information requests and retention. The current contact and church forms employ validation, a hidden honeypot field, and request origin checks, but these do not replace rate limiting. Confirm translated book availability and publisher permission before providing licensed full-text access. Test geolocation over HTTPS (Vercel provides this).

## Route and category fixes (10 October 2026)

The Vercel `cleanUrls: true` setting requires extensionless rewrite destinations (`/about`, not `/about.html`). All nine page aliases have been corrected. The Ellen White catalogue filters by a category dropdown rather than rounded chips, and decorative floating home-page subtitle cards have been removed.

## Update October 2026: Bible, study, beliefs, books and map

The site enhancements live in `assets/overhaul.js` and `assets/overhaul.css`.
The existing script exports the site helper objects before loading this enhancement bundle. The package includes the updated `assets/app.js` for fresh installs.

### Apply to the currently deployed GitHub repository

Extract this ZIP and run `powershell -ExecutionPolicy Bypass -File .\DEPLOY-UPDATE.ps1` from the extracted directory. The script clones the latest `juanjulyan/sdakerk-website` main branch, changes only relevant files, checks JavaScript syntax, commits and pushes. It does not overwrite unrelated changes.

### Supabase migration is required for Google Maps link submissions

Run the final migration commands at the bottom of `sql/supabase.sql` in the Supabase SQL Editor. A short Google Maps link may not contain coordinates. Keep that entry pending until an administrator locates the pin and verifies that it represents an Afrikaans SDA congregation. The `latitude` and `longitude` columns are nullable for pending proposals.

### Bible API

`/api/bible` now uses the Bible SuperSearch API with the `afri`, `kjv`, `wlc` and `tr` modules. No Bible API key is required. This service documents a 1000-request daily usage allowance and noncommercial-use terms. If your site is commercial, obtain written permission or host a properly licensed API yourself. Some original-language texts cover only their corresponding testament. The client supports an optional blank `to` verse to retrieve from the chosen verse through the end of the chapter.

### Lessons

A seven-day original SDAKerk Scripture study is generated with interactive Bible passage pop-ups and local-only personal notes. This is NOT a syndicated copy of the copyrighted Afrikaans Sabbath School lesson. An optional embedded frame links to the official lesson, and the fallback link always takes users to the publisher. Full reproduction of the official lesson would require permission and approved access to a content feed.

### Ellen White bookshelf

The improved bookshelf displays illustrated book covers and opens an on-site reader for the verifiable public-domain original English editions of **The Great Controversy** (Project Gutenberg #25833) and **Education** (Project Gutenberg #62102). Public domain applies to those specific original texts, not automatically to Afrikaans translations or newer compilations. These and other works remain catalogued; licensed Afrikaans digital texts will require permission and integration before on-site reading can be offered.

### Map

The map starts in the Cape Town area. The user can explicitly grant device location, zoom, reset and navigate. OpenStreetMap embeds provide a fallback when the Leaflet JavaScript CDN is blocked. Pending community submissions never appear automatically.

