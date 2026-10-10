# SDAKerk update: weekly links, PDF shelf, Bible selector

## What changed

- Bible (`/bybel`): Hebrew `wlc` removed. Afrikaans (`afri`), English KJV (`kjv`) and Greek Textus Receptus (`tr`) remain, including Scripture popups.
- Study (`/studie`): old rotating original studies are not shown. Paste a direct week-lesson URL, such as `https://absg.sspmadventist.org/af/2026-04/03`. The selection stays in localStorage and the Saturday-to-Friday tabs open the corresponding daily source pages. A metadata fetch enriches the heading; an iframe attempts to show the official original page. Publishers can block frames. Full server-rendered text extraction is opt-in only when `STUDY_CONTENT_LICENSED=true` and reuse permission has been secured.
- Books (`/boeke`): bilingual PDF bookshelf, true first-page covers for personal PDFs (via PDF.js CDN when available), local IndexedDB storage and on-site PDF reading. Book cards no longer navigate to external websites. Bulk add the 10 supplied PDFs through **Kies PDF-lêers** after choosing Afrikaans. The PDFs are not automatically on the public server.
- Public PDF publication: restricted administrator uploader; gated by distribution-rights acknowledgement, server-side admin token and Supabase storage. See below.

## Publishing to GitHub and Vercel

Unzip this package and run from its `sdakerk-website` folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\DEPLOY-UPDATE.ps1
```

This script clones the latest remote `main` into a fresh temporary folder, copies only the changed files, runs syntax tests, commits and pushes. It does **not** run `git pull --rebase` or alter any existing conflicted local repository. Vercel's GitHub integration deploys the new commit automatically.

## Rights and the supplied books

Multiple PDFs state: **personal-use licence only, no republication, distribution or derivative works**. `Opvoeding`, `Eerste Geskrifte` and `Getuienisse aan Suider-Afrika` show Stanborough Press copyright statements and `Alle regte word voorbehou`. The other EGW Estate PDFs carry end-user restrictions. Do not commit these ten files to a public GitHub repository or make them publicly accessible without written permission from the rights holders. This release includes no copyrighted PDF bodies or covers. The uploader supports private use now; later public distribution only when rights are acquired.

## Optional site-wide licensed PDF publication

1. In Supabase SQL Editor, run `sql/library.sql` once. This creates the `sdakerk_books` catalog and **private** `sdakerk-books` Storage bucket.
2. In Vercel add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SDAKERK_ADMIN_TOKEN` (32+ random characters) as server-side environment variables. These must never appear in GitHub or the frontend.
3. Redeploy. Open `Boeke` → **Bestuur: Publiseer gemagtigde PDF-boeke op die webwerf**. Enter book title, choose language, upload PDF and confirm that you have the right to distribute it. Paste the admin token when uploading; the token stays in the form only.
4. Upload flows directly to a temporary, signed Supabase Storage URL, avoiding Vercel's request size limit. Successful uploaded PDFs are catalogued and made available through short-lived signed reading URLs. The viewer stays on sdakerk.com.
5. Storage CORS may need `https://sdakerk.com` (and the testing Vercel domain) in your Storage project's allowed origins. Test with a file you own the publication rights to.

## Weekly study content permissions

The system never substitutes an invented study when the official one cannot be loaded. The chosen week and its seven daily links are correct only insofar as the entered `absg.sspmadventist.org` week URL is valid and each daily page exists. If the publisher prohibits iframe embedding, the page displays a source button. Republishing full lesson text requires the publisher's permission; the `STUDY_CONTENT_LICENSED` feature flag is **false by default**. Source metadata is retrieved only when requested. The website provides an independent, accessible Scripture passage popup via `/api/bible` if content has been licensed for reuse.

## Files changed

`assets/overhaul.js`, `assets/overhaul.css`, `assets/reader-v3.mjs`, `api/bible.js`, `api/lesson-import.js`, `api/library.js`, `api/library-pdf.js`, `sql/library.sql`, `package.json`, `README.md`.
