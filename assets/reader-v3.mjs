/* SDA Kerk reading experience. No external book downloads or fake weekly lesson text. */
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const esc = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const daysAf=['Saterdag','Sondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrydag'];
const daysEn=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const starterTitles=[
 ['EGW_af_Opvoeding.pdf','Opvoeding'],['af_DGC(COL).pdf','Die Gelykenisse van Christus'],
 ['af_DGrH(GrH).pdf','Die Groot Hoop'],['af_UG1(ST).pdf','Uittreksels uit die Getuienisskrifte'],
 ['EGW_af_MORMB.pdf','Die Meester se Onsterflike Rede'],['EGW_af_GSGC.pdf','Die Groot Stryd'],
 ['EGW_af_Eerste-Geskrifte.pdf','Eerste Geskrifte'],['EGW_af_Getuienisse-aan-Suider-Afrika.pdf','Getuienisse aan Suider-Afrika'],
 ['EGW_af_KEDA.pdf','Die Koning van die Eeue'],['EGW_af_SCSC.pdf','Skrede na Christus']
];
function studyLink(raw){
 let u;try{u=new URL(raw)}catch{throw Error('Voer ’n volledige https-skakel na die weekles in.')}
 if(u.protocol!=='https:'||u.hostname!=='absg.sspmadventist.org'||u.username||u.password||u.port)throw Error('Gebruik ’n amptelike https://absg.sspmadventist.org-leskakel.');
 const p=u.pathname.replace(/\/+$/,'');
 const found=p.match(/^\/(af|en)\/(\d{4}-\d{2})\/(\d{1,2})(?:\/(\d{1,2}))?$/);
 if(!found)throw Error('Kies die skakel na ’n spesifieke weekles, bv. /af/2026-04/03. Nie die algemene taalblad nie.');
 const quarter=found[2],week=found[3].padStart(2,'0');
 return {base:`https://absg.sspmadventist.org/${found[1]}/${quarter}/${week}`,initial:found[4]?Math.min(7,Math.max(1,Number(found[4])))-1:0};
}
export function renderStudy({h,openVerse}){
 const L=h.L;
 h.layout(h.header(L('Sabbatskool','Sabbath School'),L('Die week se Bybelstudie','This week’s Bible study'),L('Lees die week se gekose amptelike Bybelstudieles en die daaglikse afdelings.','Read the selected official weekly lesson and daily sections.'))+`
 <section class="section"><div class="container"><p class="status" id="study-link-status">${L('Laai die week se les...','Loading this week’s lesson...')}</p>
 <div id="study-import-area" hidden><div class="study-intro"><div><span class="eyebrow">${L('HUIDIGE WEEKLES','CURRENT WEEKLY LESSON')}</span><h2 id="study-current-title"></h2><p id="study-current-url" class="muted"></p></div></div><div class="study-tabs" id="study-days" role="tablist"></div><div id="study-import-body" class="daily-card"></div></div></div></section>`);
 let current=null;
  async function showWeek(initial){$('#study-import-area').hidden=false;$('#study-current-title').textContent=L('Weekles','Weekly lesson')+' '+current.base.split('/').slice(-2).join(' / ');$('#study-current-url').textContent=current.base;$('#study-days').innerHTML=(h.lang()==='af'?daysAf:daysEn).map((name,i)=>`<button type="button" class="study-day" role="tab" aria-selected="false" data-day="${i}">${esc(name)}</button>`).join('');$$('#study-days [data-day]').forEach(b=>b.onclick=()=>showDay(+b.dataset.day));await showDay(initial)}
 async function showDay(i){const source=current.base+'/'+String(i+1).padStart(2,'0');$$('#study-days [data-day]').forEach(b=>{b.classList.toggle('active',+b.dataset.day===i);b.setAttribute('aria-selected',String(+b.dataset.day===i))});const pane=$('#study-import-body');pane.innerHTML=`<p class="status">${L('Laai broninligting...','Loading source information...')}</p>`;
 try{const r=await fetch('/api/lesson-import?url='+encodeURIComponent(source));const j=await r.json();if(!r.ok)throw Error(j.error||'Bron nie beskikbaar nie');const title=j.title||((h.lang()==='af'?daysAf:daysEn)[i]);$('#study-current-title').textContent=title;
 pane.innerHTML=`<div class="lesson-head"><span class="eyebrow">${esc((h.lang()==='af'?daysAf:daysEn)[i])}</span><h2>${esc(title)}</h2><p class="muted">${esc(j.description||'')}</p><div class="toolbar"><button type="button" id="study-open-source" class="button ghost">${L('Open die amptelike les','Open official lesson')} ↗</button></div></div>${j.text?`<div class="lesson-text" id="lesson-text"></div>`:`<div class="status">${L('Die bron se volledige teks word nie hier herpubliseer sonder toestemming nie. Jy kan die amptelike les in die ingebedde leser probeer lees.','Full source text is not republished without permission. You can try to read the official lesson in the embedded reader.')}</div>`}<iframe id="study-source-frame" title="${esc(title)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(source)}"></iframe><label class="field"><span>${L('My notas op hierdie toestel','My local notes')}</span><textarea id="lesson-notes" rows="4"></textarea></label>`;
 $('#study-open-source').onclick=()=>window.open(source,'_blank','noopener,noreferrer');
 if(j.text){const content=$('#lesson-text');const refRx=/\b(?:[123]\s*)?[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?/gu;const frag=document.createDocumentFragment();const t=j.text.slice(0,60000);let cursor=0,match;while((match=refRx.exec(t))!==null){frag.append(document.createTextNode(t.slice(cursor,match.index)));const btn=document.createElement('button');btn.type='button';btn.className='ref-link';btn.textContent=match[0];btn.onclick=()=>openVerse(match[0]);frag.append(btn);cursor=match.index+match[0].length}frag.append(document.createTextNode(t.slice(cursor)));content.replaceChildren(frag)}
 const key='sdakerk-lesson-note-'+source;$('#lesson-notes').value=localStorage.getItem(key)||'';$('#lesson-notes').oninput=e=>localStorage.setItem(key,e.target.value);
 }catch(e){pane.innerHTML=`<p class="status error">${esc(e.message)}</p><button type="button" class="button ghost" id="study-fallback">${L('Lees by die oorspronklike webwerf','Read at source')} ↗</button>`;$('#study-fallback').onclick=()=>window.open(source,'_blank','noopener,noreferrer')}}

 (async()=>{try{const r=await fetch('/api/study-config',{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Kon nie die weekles laai nie.');if(!data.url){$('#study-link-status').textContent=L('Die week se Bybelstudieles is nog nie deur die administrateur ingestel nie.','This week’s Bible lesson has not yet been configured.');return}current=studyLink(data.url);$('#study-link-status').hidden=true;await showWeek(current.initial)}catch(e){$('#study-link-status').textContent=e.message}})();
}
const DB_NAME='sdakerk-personal-library';const STORE='pdfs';
function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result)})}
async function dbTransaction(type,method,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,type);const q=tx.objectStore(STORE)[method](value);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error)})}
async function localBooks(){return dbTransaction('readonly','getAll')}
async function saveLocal(record){return dbTransaction('readwrite','put',record)}
async function deleteLocal(id){return dbTransaction('readwrite','delete',id)}
let pdfJsModule=null;
async function thumbnail(file){
 try{
  pdfJsModule ||= await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  pdfJsModule.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  const doc=await pdfJsModule.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const page=await doc.getPage(1),v=page.getViewport({scale:1});const scale=Math.min(1,290/v.width);
  const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const result=canvas.toDataURL('image/jpeg',.78);await doc.destroy();return result;
 }catch{return null}
}
let activePdfUrl=null;
function cleanPdf(){if(activePdfUrl){URL.revokeObjectURL(activePdfUrl);activePdfUrl=null}}
const favoriteKeys=()=>{try{return JSON.parse(localStorage.getItem('sdakerk_pdf_favs')||'[]')}catch{return []}};
export function renderBooks({h}){
 const L=h.L;
 h.layout(h.header(L('Ellen G. White','Ellen G. White'),L('Jou digitale boekrak','Your digital bookshelf'),L('Lees boeke in Afrikaans of Engels sonder om die webwerf te verlaat.','Read Afrikaans or English books without leaving the website.'))+`
 <section class="section"><div class="container"><div class="ui-panel"><div class="controls book-controls"><div class="field"><label>${L('Soek boeke','Search books')}</label><input id="pdf-search" type="search" placeholder="${L('Soek volgens titel','Search by title')}"></div><div class="field"><label>${L('Taal','Language')}</label><select id="pdf-lang"><option value="af">Afrikaans</option><option value="en">English</option></select></div><div class="field"><label>${L('Vertoon','Display')}</label><select id="pdf-filter"><option value="all">${L('Alle boeke','All books')}</option><option value="fav">${L('Gunstelinge','Favorites')}</option></select></div></div></div>
 <p id="pdf-count" class="muted"></p><div class="library-shelves new-bookshelf" id="pdf-shelves"></div>
 <div class="reader-area" id="pdf-reader" hidden></div>
 </div></section>`);
 $('#pdf-lang').value=h.lang()==='en'?'en':'af';
 const refresh=async()=>{let online=[];
 try{const r=await fetch('/api/library');if(r.ok){const j=await r.json();online=j.books||[]}}catch{}
 const chosen=$('#pdf-lang').value,query=$('#pdf-search').value.toLowerCase(),favs=favoriteKeys();const all=[...online.map(x=>({...x,id:'pub:'+x.id,published:true}))].filter(x=>x.lang===chosen&&x.title.toLowerCase().includes(query)&&($('#pdf-filter').value!=='fav'||favs.includes(x.id)));
 $('#pdf-count').textContent=all.length+' '+L('boeke beskikbaar','books available');
 const shelf=$('#pdf-shelves');shelf.innerHTML=all.map((b,i)=>`<article class="pdf-book"><button class="pdf-cover" type="button" data-open="${esc(b.id)}" style="--spine:${['#244e57','#5e5148','#4b5b48','#51566a','#75554d'][i%5]}">${b.cover?`<img class="real-pdf-cover" alt="${esc(b.title)}" src="${b.cover}">`:`<span class="pdf-cover-head">ELLEN G. WHITE</span><strong>${esc(b.title)}</strong><span class="pdf-cover-foot">${chosen==='af'?'AFRIKAANS':'ENGLISH'}</span>`}</button><div class="pdf-book-info"><strong>${esc(b.title)}</strong><div class="book-actions"><button class="book-open" type="button" data-open="${esc(b.id)}">${L('Lees boek','Read book')}</button><button class="heart ${favs.includes(b.id)?'saved':''}" type="button" data-fav="${esc(b.id)}">${favs.includes(b.id)?'♥':'♡'}</button>${b.published?'':`<button class="book-delete" type="button" data-delete="${esc(b.id)}" title="${L('Verwyder plaaslike kopie','Remove local copy')}">×</button>`}</div></div></article>`).join('')||`<p class="empty">${L('Daar is nog geen gepubliseerde boeke in hierdie taal nie.','There are no published books in this language yet.')}</p>`;
 $$('[data-open]').forEach(b=>b.onclick=()=>openReader(all.find(x=>x.id===b.dataset.open)));
 $$('[data-fav]').forEach(b=>b.onclick=()=>{const set=new Set(favoriteKeys());set.has(b.dataset.fav)?set.delete(b.dataset.fav):set.add(b.dataset.fav);localStorage.setItem('sdakerk_pdf_favs',JSON.stringify([...set]));refresh()});
 $$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm(L('Verwyder hierdie boek van hierdie toestel?','Remove this book from this device?')))return;await deleteLocal(b.dataset.delete);refresh()});
 };
 async function openReader(book){if(!book)return;cleanPdf();const panel=$('#pdf-reader');panel.hidden=false;panel.innerHTML=`<div class="reader-head"><h2>${esc(book.title)}</h2><button class="button ghost" id="pdf-close">× ${L('Maak toe','Close')}</button></div><p id="pdf-reader-status"></p><iframe id="pdf-frame" class="pdf-frame" title="${esc(book.title)}"></iframe>`;$('#pdf-close').onclick=()=>{panel.hidden=true;$('#pdf-frame').removeAttribute('src');cleanPdf()};if(book.published){$('#pdf-frame').src='/api/library-pdf?id='+encodeURIComponent(book.id.slice(4))}else{activePdfUrl=URL.createObjectURL(book.file);$('#pdf-frame').src=activePdfUrl}panel.scrollIntoView({behavior:'smooth',block:'start'})}
 $$('input#pdf-search,select#pdf-lang,select#pdf-filter').forEach(el=>el.oninput=refresh);

 refresh();
}
