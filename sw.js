/* Bunkit service worker: network-first. Whenever you commit to GitHub, the next time someone opens
   the app online they get the new files (no cache-name bumping needed). Offline, it falls back to the saved copy. */
const C="bunkit-cache";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(C).then(c=>Promise.all(FILES.map(u=>fetch(u,{cache:"reload"}).then(r=>{if(r&&r.ok)return c.put(u,r)}).catch(()=>{})))));
 self.skipWaiting()});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request;
 if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
 e.respondWith((async()=>{
  const cache=await caches.open(C);
  const net=fetch(r,{cache:"no-cache"}).then(res=>{if(res&&res.ok)cache.put(r,res.clone());return res});
  net.catch(()=>{});
  try{
   return await Promise.race([net,new Promise((_,no)=>setTimeout(no,4000))]);
  }catch(_){
   const hit=await cache.match(r,{ignoreSearch:true})||(r.mode==="navigate"?await cache.match("./index.html"):null);
   if(hit)return hit;
   try{return await net}catch(__){return Response.error()}
  }})())});
