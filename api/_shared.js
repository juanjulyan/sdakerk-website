const send=(res,status,obj)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.status(status).json(obj)};
const getBody=(req)=>{if(typeof req.body==='object'&&req.body)return req.body;if(typeof req.body==='string')return JSON.parse(req.body);return {}};
const allowedOrigin=(req)=>{const host=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0];const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===host}catch{return false}};
const clip=(s,max)=>String(s??'').trim().slice(0,max);
const validEmail=(s)=>typeof s==='string'&&s.length<=180&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
module.exports={send,getBody,allowedOrigin,clip,validEmail};
