const {timingSafeEqual}=require('node:crypto');
const {send,allowedOrigin}=require('./_shared');
const base=()=>String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const ready=()=>!!(base()&&key());
const authorized=req=>{const expected=process.env.SDAKERK_ADMIN_TOKEN||'',input=String(req.headers['x-sdakerk-admin-token']||'');if(expected.length<32||input.length!==expected.length)return false;return timingSafeEqual(Buffer.from(input),Buffer.from(expected))};
const headers=()=>({'apikey':key(),'Authorization':'Bearer '+key(),'Content-Type':'application/json'});
const parseUrl=raw=>{const u=new URL(raw);if(u.protocol!=='https:'||u.hostname!=='absg.sspmadventist.org'||u.username||u.password||u.port)throw Error('Gebruik die amptelike Sabbatskool-URL.');const m=u.pathname.match(/^\/(af|en)\/(\d{4}-\d{2})\/(\d{1,2})(?:\/(\d{1,2}))?\/?$/);if(!m)throw Error('Gebruik die skakel na een weekles, byvoorbeeld /af/2026-04/03');const month=Number(m[2].slice(5));if(month<1||month>12||Number(m[3])<1||Number(m[3])>14)throw Error('Ongeldige lesdatum.');return 'https://absg.sspmadventist.org/'+m[1]+'/'+m[2]+'/'+m[3].padStart(2,'0')};
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');
 if(req.method==='GET'){
  if(!ready())return send(res,200,{url:null,configured:false});
  try{const r=await fetch(base()+'/rest/v1/sdakerk_settings?select=value&key=eq.weekly_lesson&limit=1',{headers:headers(),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Database request failed');const rows=await r.json();return send(res,200,{url:rows[0]?.value||null,configured:true})}catch{return send(res,503,{error:'Die weekles kon nie uit die databasis gelees word nie.'})}
 }
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(!allowedOrigin(req))return send(res,403,{error:'Invalid origin'});
 if(!authorized(req))return send(res,403,{error:'Administrateurtoegang geweier.'});
 if(!ready())return send(res,503,{error:'Stel eers SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in Vercel op.'});
 try{const url=parseUrl(String(req.body?.url||''));const r=await fetch(base()+'/rest/v1/sdakerk_settings?on_conflict=key',{method:'POST',headers:{...headers(),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({key:'weekly_lesson',value:url,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Die weekles kon nie gestoor word nie. Kontroleer sdakerk_settings.');return send(res,200,{ok:true,url})}catch(e){return send(res,400,{error:e.message})}
};
