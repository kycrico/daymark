/* Daymark offline runtime, network-first for fresh code and offline fallback. */
const CACHE="daymark-the-path-v5-fresh-assets-20261111";
const CORE=["./","./index.html","./app.js?v=20261111a","./style.css?v=20261111a","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("daymark-")&&key!==CACHE).map(key=>caches.delete(key))))
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   if(response.ok){
    await cache.put(request,response.clone());
    if(request.mode==="navigate")await cache.put("./index.html",response.clone());
   }
   return response;
  }catch(error){
   let cached=await caches.match(request);
   if(!cached)cached=await caches.match(request,{ignoreSearch:true});
   if(!cached&&request.mode==="navigate")cached=await caches.match("./index.html");
   return cached||Response.error();
  }
 })());
});
