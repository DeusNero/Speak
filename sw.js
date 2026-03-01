const CACHE_NAME='speak-runtime';

self.addEventListener('install',(e)=>{
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache=>cache.addAll(['./','./index.html']))
    );
    self.skipWaiting();
});

self.addEventListener('activate',(e)=>{
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',(e)=>{
    if(e.request.method!=='GET')return;
    e.respondWith((async()=>{
        try{
            const network=await fetch(e.request,{cache:'no-store'});
            if(network&&network.ok){
                const clone=network.clone();
                caches.open(CACHE_NAME).then(cache=>cache.put(e.request,clone));
            }
            return network;
        }catch(err){
            const cached=await caches.match(e.request);
            if(cached)return cached;
            if(e.request.mode==='navigate'){
                const fallback=await caches.match('./index.html');
                if(fallback)return fallback;
            }
            throw err;
        }
    })());
});
