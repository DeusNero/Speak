/* Offline Recording Queue — IndexedDB storage + auto-retry */

const _OQ_DB='speak-queue';
const _OQ_STORE='pending';

function _oqOpen(){
    return new Promise((res,rej)=>{
        var r=indexedDB.open(_OQ_DB,1);
        r.onupgradeneeded=e=>e.target.result.createObjectStore(_OQ_STORE,{keyPath:'id'});
        r.onsuccess=e=>res(e.target.result);
        r.onerror=e=>rej(e.target.error);
    });
}

async function oqSave(item){
    try{var db=await _oqOpen();return new Promise((res,rej)=>{var tx=db.transaction(_OQ_STORE,'readwrite');tx.objectStore(_OQ_STORE).put(item);tx.oncomplete=res;tx.onerror=e=>rej(e.target.error);});}
    catch(e){console.warn('oqSave failed',e);}
}

async function oqGetAll(){
    try{var db=await _oqOpen();return new Promise((res,rej)=>{var tx=db.transaction(_OQ_STORE,'readonly');var r=tx.objectStore(_OQ_STORE).getAll();r.onsuccess=e=>res(e.target.result||[]);r.onerror=e=>rej(e.target.error);});}
    catch(e){console.warn('oqGetAll failed',e);return [];}
}

async function oqRemove(id){
    try{var db=await _oqOpen();return new Promise((res,rej)=>{var tx=db.transaction(_OQ_STORE,'readwrite');tx.objectStore(_OQ_STORE).delete(id);tx.oncomplete=res;tx.onerror=e=>rej(e.target.error);});}
    catch(e){console.warn('oqRemove failed',e);}
}

async function oqRefreshPending(){
    window._pendingItems=await oqGetAll();
    if(typeof renderCaptures==='function')renderCaptures();
}

var _oqRetrying=false;
async function oqRetryAll(){
    if(_oqRetrying||!navigator.onLine)return;
    var items=await oqGetAll();
    if(!items.length)return;
    _oqRetrying=true;
    for(var i=0;i<items.length;i++){
        var item=items[i];
        try{
            var transcript=await transcribeAudio(item.blob,item.lang);
            if(transcript&&transcript.trim()){
                var text=cleanupTranscript(transcript,item.lang);
                if(item.habitId){
                    var hab=habits.find(h=>h.id===item.habitId);
                    if(hab){hab.entries.push({id:item.id,text,inputType:'voice',lang:item.lang,createdAt:item.createdAt});saveHabits();}
                }else if(item.habitsPgDirectCreate){
                    habits.push({id:item.id,name:text,entries:[],favourite:false,createdAt:item.createdAt});saveHabits();
                }else{
                    captures.unshift({id:item.id,text,mood:null,tags:[],lang:item.lang,inputType:'voice',createdAt:item.createdAt});saveCaptures();
                }
                await oqRemove(item.id);
                window._pendingItems=(window._pendingItems||[]).filter(p=>p.id!==item.id);
                if(typeof renderCaptures==='function')renderCaptures();
                showToast('Recording transcribed \u2713');
            }
        }catch(e){console.warn('Retry failed for',item.id,e);}
    }
    _oqRetrying=false;
}

/* Auto-retry when internet returns */
window.addEventListener('online',()=>oqRetryAll());

/* Poll every 60s while app is open */
setInterval(()=>oqRetryAll(),60000);

/* Load pending items into memory on startup */
window._pendingItems=[];
oqGetAll().then(items=>{window._pendingItems=items;if(typeof renderCaptures==='function')renderCaptures();});
