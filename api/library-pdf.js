const {send}=require('./_shared');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const id=String(req.query.id||'');if(!/^[a-f0-9-]{36}$/i.test(id))return send(res,400,{error:'Invalid book ID'});
 const host=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!host||!key)return send(res,503,{error:'Library unavailable'});
 const h={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 try{const r=await fetch(host+'/rest/v1/sdakerk_books?select=storage_path&published=eq.true&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:h});if(!r.ok)throw Error('Catalogue unavailable');const [book]=await r.json();if(!book)return send(res,404,{error:'Book not published'});
 const s=await fetch(host+'/storage/v1/object/sign/sdakerk-books/'+book.storage_path,{method:'POST',headers:h,body:JSON.stringify({expiresIn:900})});if(!s.ok)throw Error('Unable to access reader');const j=await s.json();const signed=j.signedURL||j.signedUrl;if(!signed)throw Error('Signed URL unavailable');res.setHeader('Cache-Control','private, no-store');res.writeHead(302,{Location:new URL(signed,host).toString()});res.end();
 }catch(e){return send(res,502,{error:e.message})}
};
