# SDAKerk site update. Preserves the latest main branch and commits only changed files.
$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$repository = 'https://github.com/juanjulyan/sdakerk-website.git'
$destination = Join-Path $env:TEMP ('sdakerk-deploy-' + (Get-Date -Format 'yyyyMMddHHmmss'))

function CheckExit([string]$description) {
    if ($LASTEXITCODE -ne 0) { throw "$description failed, exit code $LASTEXITCODE" }
}

Write-Host 'Cloning latest SDAKerk source from GitHub...' -ForegroundColor Cyan
git clone --depth 1 --branch main $repository $destination
CheckExit 'Git clone'

$items = @('api/bible.js', 'api/books.js', 'api/churches.js', 'assets/overhaul.js', 'assets/overhaul.css')
foreach ($file in $items) {
    $target = Join-Path $destination $file
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination $target -Force
}

$app = Join-Path $destination 'assets/app.js'
$content = [System.IO.File]::ReadAllText($app)
if (-not $content.Contains('window.sdakerkSite=')) {
    $patch = @'
window.sdakerkSite={L,lang,layout,header,esc,bookList,egwBooks,beliefGroups,officialAfrikaansLinks,officialAfrikaansCodes};
if(!['bible','about','study','books','churches'].includes(document.body.dataset.page)) render();
const extraCSS=document.createElement('link');extraCSS.rel='stylesheet';extraCSS.href='/assets/overhaul.css';document.head.appendChild(extraCSS);
const improved=document.createElement('script');improved.src='/assets/overhaul.js';improved.defer=true;document.head.appendChild(improved);
'@
    $regex = [regex]'render\(\);\s*$'
    if (-not $regex.IsMatch($content)) { throw 'Could not find final render() in assets/app.js. No changes pushed.' }
    $content = $regex.Replace($content, $patch + "`n")
    [System.IO.File]::WriteAllText($app, $content, [System.Text.UTF8Encoding]::new($false))
}

$sql = Join-Path $destination 'sql/supabase.sql'
if (Test-Path $sql) {
    $db = [System.IO.File]::ReadAllText($sql)
    if (-not $db.Contains('add column if not exists google_maps_url')) {
        $db += "`n-- Google Maps link submissions, GPS optional pending moderation`nalter table public.churches add column if not exists google_maps_url text;`nalter table public.churches alter column latitude drop not null;`nalter table public.churches alter column longitude drop not null;`n"
        [System.IO.File]::WriteAllText($sql,$db,[System.Text.UTF8Encoding]::new($false))
    }
}

Push-Location $destination
try {
    node --check assets/app.js; CheckExit 'Check app.js'
    node --check assets/overhaul.js; CheckExit 'Check overhaul.js'
    node --check api/bible.js; CheckExit 'Check Bible API'
    node --check api/books.js; CheckExit 'Check books API'
    node --check api/churches.js; CheckExit 'Check churches API'
    git add assets/app.js assets/overhaul.js assets/overhaul.css api/bible.js api/books.js api/churches.js sql/supabase.sql
    CheckExit 'Git add'
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'No changes found. Website already up to date.' -ForegroundColor Yellow
    } else {
        git commit -m 'SDAKerk Bible, study, books and churches enhancements'
        CheckExit 'Git commit'
        git push origin main
        CheckExit 'Git push'
        Write-Host 'Changes pushed. Vercel should deploy automatically.' -ForegroundColor Green
    }
} finally {
    Pop-Location
    Write-Host "Temporary cloned repository: $destination"
}
