const {send}=require('./_shared');
const codes=`GEN Genesis|EXO Exodus|LEV Leviticus|NUM Numbers|DEU Deuteronomy|JOS Joshua|JDG Judges|RUT Ruth|1SA 1 Samuel|2SA 2 Samuel|1KI 1 Kings|2KI 2 Kings|1CH 1 Chronicles|2CH 2 Chronicles|EZR Ezra|NEH Nehemiah|EST Esther|JOB Job|PSA Psalms|PRO Proverbs|ECC Ecclesiastes|SNG Song of Solomon|ISA Isaiah|JER Jeremiah|LAM Lamentations|EZK Ezekiel|DAN Daniel|HOS Hosea|JOL Joel|AMO Amos|OBA Obadiah|JON Jonah|MIC Micah|NAM Nahum|HAB Habakkuk|ZEP Zephaniah|HAG Haggai|ZEC Zechariah|MAL Malachi|MAT Matthew|MRK Mark|LUK Luke|JHN John|ACT Acts|ROM Romans|1CO 1 Corinthians|2CO 2 Corinthians|GAL Galatians|EPH Ephesians|PHP Philippians|COL Colossians|1TH 1 Thessalonians|2TH 2 Thessalonians|1TI 1 Timothy|2TI 2 Timothy|TIT Titus|PHM Philemon|HEB Hebrews|JAS James|1PE 1 Peter|2PE 2 Peter|1JN 1 John|2JN 2 John|3JN 3 John|JUD Jude|REV Revelation`.split('|').map(x=>{const i=x.indexOf(' ');return [x.slice(0,i),x.slice(i+1)]});
const books=Object.fromEntries(codes);const licensed={af1953:'BIBLE_ID_AF1953',af1983:'BIBLE_ID_AF1983',af2020:'BIBLE_ID_AF2020',boodskap:'BIBLE_ID_BOODSKAP',ceb:'BIBLE_ID_CEB',message:'BIBLE_ID_MESSAGE',hebrew:'BIBLE_ID_HEBREW',greek:'BIBLE_ID_GREEK'};
async function sourceFetch(url,headers={}){const signal=AbortSignal.timeout(12500);const r=await fetch(url,{headers,signal});if(!r.ok)throw Error(`Upstream returned ${r.status}`);return r.json()}
module.exports=async function handler(req,res){if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});const {book,chapter,from,to,translation}=req.query;if(!books[book]||!/^\d{1,3}$/.test(String(chapter))||!/^\d{1,3}$/.test(String(from))||!/^\d{1,3}$/.test(String(to))||+chapter<1||+chapter>150||+from<1||+from>176||+to>176||(+to&&+to<+from)||!['kjv',...Object.keys(licensed)].includes(translation))return send(res,400,{error:'Invalid Bible reference'});
try{
 if(translation==='kjv'){
  const ref=`${books[book]} ${chapter}${+to?':'+from+'-'+to:''}`;
  const data=await sourceFetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`);
  if(data.error)return send(res,404,{error:data.error});
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({reference:ref,verses:(data.verses||[]).filter(v=>v.chapter===+chapter&&v.verse>=+from&&(!+to||v.verse<=+to)).map(v=>({verse:v.verse,text:v.text.replace(/\s+/g,' ').trim()}))});
 }
 const id=process.env[licensed[translation]],key=process.env.BIBLE_API_KEY;
 if(!id||!key)return send(res,501,{error:'Hierdie vertaling vereis ’n gemagtigde API-sleutel en uitgewerstoestemming. / This translation requires an authorized API key and publisher permission.'});
 const count=+to?+to-+from+1:0;
 if(!count||count>40)return send(res,400,{error:'Vir gelisensieerde vertalings, kies asseblief ’n eindvers, maksimum 40 verse. / Please choose an end verse, maximum 40 verses.'});
 const headers={'api-key':key};
 const results=await Promise.all(Array.from({length:count},(_,i)=>+from+i).map(async n=>{const idVerse=`${book}.${chapter}.${n}`;const j=await sourceFetch(`https://rest.api.bible/v1/bibles/${encodeURIComponent(id)}/verses/${encodeURIComponent(idVerse)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`,headers);return {verse:n,text:String(j.data?.content||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()}}));
 res.setHeader('Cache-Control','public, s-maxage=3600');return res.status(200).json({reference:`${book} ${chapter}:${from}-${to}`,verses:results});
}catch{return send(res,502,{error:'Die Bybelbron is tans nie beskikbaar nie. / Bible provider is temporarily unavailable.'})}
};
