/* Import source metadata without silently republishing copyrighted weekly lesson text.
   Set STUDY_CONTENT_LICENSED=true only after you obtain an appropriate licence. */
const {send}=require('./_shared');
const htmlDecode=x=>String(x||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([a-f0-9]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,m=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[m]));
const strip=x=>htmlDecode(x.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
function legalUrl(raw){const u=new URL(raw);if(u.protocol!=='https:'||u.hostname!=='absg.sspmadventist.org'||u.username||u.password||u.port||!/^\/(af|en)\/\d{4}-\d{2}\/\d{1,2}\/0[1-7]$/.test(u.pathname))throw Error('Verskaf die amptelike skakel na ’n lesdag.');u.search='';u.hash='';return u}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 let u;try{u=legalUrl(String(req.query.url||''))}catch(e){return send(res,400,{error:e.message})}
 try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),7000);let r;try{r=await fetch(u,{signal:ctl.signal,headers:{'Accept':'text/html','User-Agent':'SDAKerkReader/1.0 (hi@sdakerk.com)'},redirect:'error'})}finally{clearTimeout(t)}
 if(!r.ok)throw Error('Amptelike lesblad het status '+r.status);const len=Number(r.headers.get('content-length')||0);if(len>2e6)throw Error('Bronblad is te groot');const raw=(await r.text()).slice(0,2e6);
 const getMeta=(type)=>{const a=raw.match(new RegExp(`<meta[^>]+(?:property|name)=["']${type}["'][^>]*>`, 'i'))?.[0]||'';return htmlDecode(a.match(/content=["']([^"']*)["']/i)?.[1]||'')};
 const title=getMeta('og:title')||strip(raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'')||'Sabbatskoolles';const description=getMeta('description')||getMeta('og:description');
 let text='';if(process.env.STUDY_CONTENT_LICENSED==='true'){
   // Use only publisher-authorised reuse. Sanitise the fetched HTML before extracting text.
   const article=raw.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1]||'';
   text=strip(article).slice(0,55000);
 }
 res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=300');return send(res,200,{url:u.toString(),title,description,text,licensed:!!text});
 }catch(e){return send(res,502,{error:'Kon nie die les vanaf die amptelike webwerf laai nie: '+String(e.message).slice(0,140)})}
};
