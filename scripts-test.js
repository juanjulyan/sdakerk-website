const assert = require('node:assert/strict');
function makeRes(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(d){this.data=d;return this}}}
(async()=>{
 const old=global.fetch;
 global.fetch=async url=>({ok:true,json:async()=>({errors:[],error_level:0,results:[{verses:{afri:{3:{16:{chapter:3,verse:16,text:'Want so lief...'},17:{chapter:3,verse:17,text:'Want...'}}}}}]})});
 const bible=require('./api/bible');let r=makeRes();await bible({method:'GET',query:{book:'JHN',chapter:'3',from:'16',to:'17',translation:'afri'}},r);assert.equal(r.statusCode,200);assert.equal(r.data.verses.length,2);
 r=makeRes();await bible({method:'GET',query:{book:'JHN',chapter:'3',from:'16',to:'',translation:'afri'}},r);assert.equal(r.statusCode,200);assert.equal(r.data.verses.length,2);
 r=makeRes();await bible({method:'GET',query:{reference:'John 3:16',translation:'xx'}},r);assert.equal(r.statusCode,400);
 process.env.SUPABASE_URL='https://valid.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='example';
 let data=null;
 global.fetch=async (url,init)=>{data=JSON.parse(init.body);return {ok:true,json:async()=>[]}};
 const churches=require('./api/churches');r=makeRes();await churches({method:'POST',headers:{host:'localhost'},body:{name:'Test SDA Church',address:'Test Street, Cape Town',google_maps_url:'https://www.google.com/maps/place/Foo/!3d-33.9!4d18.6'}},r);assert.equal(r.statusCode,201);assert.equal(data.latitude,-33.9);assert.equal(data.longitude,18.6);
 r=makeRes();await churches({method:'POST',headers:{host:'localhost'},body:{name:'Test SDA Church',address:'Test Street, Cape Town',google_maps_url:'https://maps.app.goo.gl/TestFoo'}},r);assert.equal(r.statusCode,201);assert.equal(data.latitude,null);assert.equal(data.google_maps_url,'https://maps.app.goo.gl/TestFoo');
 global.fetch=old;console.log('PASS: Bible API, blank verse range, translation validation, Google Maps link, Google short link');
})().catch(e=>{console.error(e);process.exit(1)});
