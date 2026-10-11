const {randomUUID,timingSafeEqual}=require('crypto');
const {send}=require('./_shared');
const base=()=>String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const bucket='sdakerk-books';
const headers=()=>({'apikey':key(),'Authorization':'Bearer '+key(),'Content-Type':'application/json'});
const ready=()=>base().startsWith('https://')&&key();
const admin=req=>{const expected=process.env.SDAKERK_ADMIN_TOKEN||'',actual=String(req.headers['x-sdakerk-admin-token']||'');if(expected.length<32||actual.length!==expected.length)return false;return timingSafeEqual(Buffer.from(expected),Buffer.from(actual))};
const getJson=async(r)=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.message||j.error||'Supabase error ('+r.status+')');return j};
const table=()=>base()+'/rest/v1/sdakerk_books';
const safe=(v,max)=>String(v||'').trim().slice(0,max);
module.exports=async(req,res)=>{
 if(req.method==='GET'&&req.query.action==='verify')return send(res,admin(req)?200:403,{authorized:admin(req)});
 if(req.method==='GET'){
  if(!ready())return send(res,200,{books:[],configured:false});
  try{const r=await fetch(table()+'?select=id,title,lang,published_at&published=eq.true&order=published_at.desc&limit=250',{headers:headers()});return send(res,200,{books:await getJson(r),configured:true})}catch{return send(res,200,{books:[],configured:false})}
 }
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(!ready())return send(res,503,{error:'Supabase is nog nie vir die boekrak opgestel nie.'});
 if(!admin(req))return send(res,403,{error:'Administrateurtoegang geweier.'});
 const data=req.body||{},action=req.query.action,title=safe(data.title,160),lang=data.lang;
 if(!title||!['af','en'].includes(lang)||data.rights!==true)return send(res,400,{error:'Titel, taal en bevestigde verspreidingstoestemming word vereis.'});
 try{
  if(action==='prepare'){
   if(!String(data.filename||'').toLowerCase().endsWith('.pdf')||Number(data.size)>60*1024*1024||Number(data.size)<100)return send(res,400,{error:'Slegs PDF-lêers tot 60 MB word aanvaar.'});
   const id=randomUUID(),path='library/'+id+'.pdf',url=base()+'/storage/v1/object/upload/sign/'+bucket+'/'+path;
   const signed=await getJson(await fetch(url,{method:'POST',headers:headers(),body:'{}'}));
   if(!signed.url)throw Error('Geen ondertekende oplaaiskakel teruggegee nie');
   return send(res,200,{id,path,uploadUrl:new URL(signed.url,base()).toString()});
  }
  if(action==='finalize'){
   const id=String(data.id||'').toLowerCase(),path=String(data.path||'');if(!/^[a-f0-9-]{36}$/.test(id)||path!=='library/'+id+'.pdf')return send(res,400,{error:'Ongeldige boekverwysing'});
   const verify=await fetch(base()+'/storage/v1/object/info/'+bucket+'/'+path,{headers:headers()});if(!verify.ok)return send(res,400,{error:'PDF kon nie in die veilige stoorplek gevind word nie.'});
   const record={id,title,lang,storage_path:path,published:true,published_at:new Date().toISOString()};
   const r=await fetch(table(),{method:'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(record)});const rows=await getJson(r);return send(res,201,{book:rows[0]||record});
  }
  return send(res,400,{error:'Ongeldige oplaaiaksie'});
 }catch(e){return send(res,502,{error:String(e.message).slice(0,180)})}
};
