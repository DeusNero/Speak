const SUPABASE_URL='https://yhhclegajyezejacendp.supabase.co';
const SUPABASE_KEY='sb_publishable_y8pAGrTaRrvvYmNZadIe2w_ayd7PFIg';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

var _sbUser=null;
var _syncInProgress=false;
var _encKey=null; /* AES-GCM key — derived from password on login, never stored */

/* ---- Encryption helpers (Web Crypto API — works on all browsers incl. iOS Safari) ---- */

async function _deriveKey(password,userId){
    var enc=new TextEncoder();
    var keyMaterial=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey(
        {name:'PBKDF2',salt:enc.encode(userId),iterations:100000,hash:'SHA-256'},
        keyMaterial,
        {name:'AES-GCM',length:256},
        false,
        ['encrypt','decrypt']
    );
}

async function _encrypt(text){
    if(!_encKey||!text)return text;
    try{
        var enc=new TextEncoder();
        var iv=crypto.getRandomValues(new Uint8Array(12));
        var ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},_encKey,enc.encode(text));
        var combined=new Uint8Array(12+ciphertext.byteLength);
        combined.set(iv);combined.set(new Uint8Array(ciphertext),12);
        return 'enc:'+btoa(String.fromCharCode(...combined));
    }catch(e){console.warn('Encrypt failed',e);return text;}
}

async function _decrypt(val){
    if(!_encKey||!val)return val;
    if(!val.startsWith('enc:'))return val; /* legacy plain text — show as-is */
    try{
        var combined=Uint8Array.from(atob(val.slice(4)),c=>c.charCodeAt(0));
        var iv=combined.slice(0,12);
        var ciphertext=combined.slice(12);
        var plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},_encKey,ciphertext);
        return new TextDecoder().decode(plain);
    }catch(e){console.warn('Decrypt failed',e);return '[encrypted]';}
}

/* ---- Auth ---- */

async function sbInit(){
    try{
        const{data,error}=await sb.auth.getSession();
        if(error){console.error('Auth init error:',error);document.getElementById('auth-overlay').classList.add('visible');return;}
        if(data.session){
            _sbUser=data.session.user;
            /* Key cannot be re-derived without the password — prompt login to re-derive */
            document.getElementById('auth-overlay').classList.add('visible');
            document.getElementById('auth-returning').style.display='block';
            document.getElementById('auth-new').style.display='none';
        }else{
            document.getElementById('auth-overlay').classList.add('visible');
        }
    }catch(err){
        console.error('sbInit failed:',err);
        if(typeof showToast==='function')showToast('Cloud sync unavailable');
    }
}

document.getElementById('auth-login-btn').addEventListener('click',async()=>{
    var email=document.getElementById('auth-email').value.trim();
    var pass=document.getElementById('auth-password').value;
    var errEl=document.getElementById('auth-error');
    errEl.style.display='none';
    if(!email||!pass){errEl.textContent='Please enter email and password.';errEl.style.display='block';return;}
    var btn=document.getElementById('auth-login-btn');
    btn.textContent='Unlocking your data\u2026';btn.disabled=true;
    const{data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error){errEl.textContent=error.message;errEl.style.display='block';btn.textContent='Sign in';btn.disabled=false;return;}
    _sbUser=data.user;
    _encKey=await _deriveKey(pass,_sbUser.id);
    document.getElementById('auth-overlay').classList.remove('visible');
    sbRestoreIfNeeded();
    btn.textContent='Sign in';btn.disabled=false;
});

document.getElementById('auth-signup-btn').addEventListener('click',async()=>{
    var email=document.getElementById('auth-email').value.trim();
    var pass=document.getElementById('auth-password').value;
    var errEl=document.getElementById('auth-error');
    errEl.style.display='none';
    if(!email||!pass){errEl.textContent='Please enter email and password.';errEl.style.display='block';return;}
    if(pass.length<8){errEl.textContent='Password must be at least 8 characters.';errEl.style.display='block';return;}
    var btn=document.getElementById('auth-signup-btn');
    btn.textContent='Creating account\u2026';btn.disabled=true;
    const{data,error}=await sb.auth.signUp({email,password:pass});
    if(error){errEl.textContent=error.message;errEl.style.display='block';btn.textContent='Create account';btn.disabled=false;return;}
    _sbUser=data.user;
    _encKey=await _deriveKey(pass,_sbUser.id);
    document.getElementById('auth-overlay').classList.remove('visible');
    sbFullUpload();
    btn.textContent='Create account';btn.disabled=false;
});

document.getElementById('auth-toggle-signup').addEventListener('click',()=>{
    document.getElementById('auth-returning').style.display='none';
    document.getElementById('auth-new').style.display='block';
    document.getElementById('auth-error').style.display='none';
});

document.getElementById('auth-toggle-login').addEventListener('click',()=>{
    document.getElementById('auth-returning').style.display='block';
    document.getElementById('auth-new').style.display='none';
    document.getElementById('auth-error').style.display='none';
});

/* ---- Data restore ---- */

async function sbRestoreIfNeeded(){
    if(!_sbUser)return;
    var localThoughts=JSON.parse(localStorage.getItem('speak_captures')||'[]');
    var localHabits=JSON.parse(localStorage.getItem('speak_habits')||'[]');
    if(localThoughts.length===0&&localHabits.length===0){
        await sbRestoreFromCloud();
    }else{
        sbFullUpload();
    }
}

async function sbRestoreFromCloud(){
    if(!_sbUser)return;
    try{
        const{data:cloudThoughts}=await sb.from('thoughts').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:false});
        if(cloudThoughts&&cloudThoughts.length>0){
            var decThoughts=[];
            for(var i=0;i<cloudThoughts.length;i++){
                var r=cloudThoughts[i];
                decThoughts.push({
                    id:r.id,
                    text:await _decrypt(r.text),
                    mood:r.mood,
                    eventMood:r.event_mood,
                    tags:r.tag?[r.tag]:[],
                    lang:r.lang,
                    inputType:r.input_type,
                    aiRefined:r.ai_refined?await _decrypt(r.ai_refined):null,
                    createdAt:r.created_at
                });
            }
            captures=decThoughts;
            saveCaptures();
        }
        const{data:cloudHabits}=await sb.from('habits').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:false});
        if(cloudHabits&&cloudHabits.length>0){
            const{data:cloudEntries}=await sb.from('habit_entries').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:true});
            var entriesByHabit={};
            for(var j=0;j<(cloudEntries||[]).length;j++){
                var e=cloudEntries[j];
                if(!entriesByHabit[e.habit_id])entriesByHabit[e.habit_id]=[];
                entriesByHabit[e.habit_id].push({
                    id:e.id,
                    text:await _decrypt(e.text),
                    title:e.title?await _decrypt(e.title):undefined,
                    inputType:e.input_type,
                    lang:e.lang,
                    aiRefined:e.ai_refined?await _decrypt(e.ai_refined):null,
                    createdAt:e.created_at
                });
            }
            habits=await Promise.all(cloudHabits.map(async h=>({
                id:h.id,
                name:await _decrypt(h.name),
                favourite:h.favourite,
                createdAt:h.created_at,
                entries:entriesByHabit[h.id]||[]
            })));
            saveHabits();
        }
        if(typeof renderCaptures==='function')renderCaptures();
        if(typeof renderHabits==='function')renderHabits();
        showToast('Data restored from cloud');
    }catch(err){
        console.error('Cloud restore failed:',err);
    }
}

async function sbFullUpload(){
    if(!_sbUser||_syncInProgress)return;
    _syncInProgress=true;
    try{
        await sbSyncThoughts();
        await sbSyncHabits();
    }catch(err){
        console.error('Full upload failed:',err);
    }
    _syncInProgress=false;
}

/* ---- Sync (encrypts before sending) ---- */

async function sbSyncThoughts(){
    if(!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_captures')||'[]');
    if(!local.length)return;
    var rows=[];
    for(var i=0;i<local.length;i++){
        var c=local[i];
        rows.push({
            id:c.id,
            user_id:_sbUser.id,
            text:await _encrypt(c.text),
            input_type:c.inputType||'voice',
            lang:c.lang||null,
            tag:(c.tags&&c.tags[0])||null,
            mood:c.mood||null,
            event_mood:c.eventMood||null,
            ai_refined:c.aiRefined?await _encrypt(c.aiRefined):null,
            created_at:c.createdAt,
            updated_at:new Date().toISOString()
        });
    }
    const{error}=await sb.from('thoughts').upsert(rows,{onConflict:'id'});
    if(error){console.error('Thoughts sync error:',error);if(typeof showToast==='function')showToast('Sync error: '+error.message);}
}

async function sbSyncHabits(){
    if(!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_habits')||'[]');
    if(!local.length)return;
    var habitRows=[];
    for(var i=0;i<local.length;i++){
        var h=local[i];
        habitRows.push({
            id:h.id,
            user_id:_sbUser.id,
            name:await _encrypt(h.name),
            favourite:h.favourite||false,
            created_at:h.createdAt,
            updated_at:new Date().toISOString()
        });
    }
    const{error:hErr}=await sb.from('habits').upsert(habitRows,{onConflict:'id'});
    if(hErr){console.error('Habits sync error:',hErr);if(typeof showToast==='function')showToast('Sync error: '+hErr.message);return;}
    var entryRows=[];
    for(var j=0;j<local.length;j++){
        var hab=local[j];
        for(var k=0;k<(hab.entries||[]).length;k++){
            var e=hab.entries[k];
            entryRows.push({
                id:e.id,
                habit_id:hab.id,
                user_id:_sbUser.id,
                text:await _encrypt(e.text),
                title:e.title?await _encrypt(e.title):null,
                input_type:e.inputType||'voice',
                lang:e.lang||null,
                ai_refined:e.aiRefined?await _encrypt(e.aiRefined):null,
                created_at:e.createdAt,
                updated_at:new Date().toISOString()
            });
        }
    }
    if(entryRows.length){
        const{error:eErr}=await sb.from('habit_entries').upsert(entryRows,{onConflict:'id'});
        if(eErr){console.error('Habit entries sync error:',eErr);if(typeof showToast==='function')showToast('Sync error: '+eErr.message);}
    }
}

/* ---- Delete ---- */

async function sbDeleteThought(id){if(!_sbUser)return;await sb.from('thoughts').delete().eq('id',id).eq('user_id',_sbUser.id);}
async function sbDeleteThoughts(ids){if(!_sbUser||!ids.length)return;await sb.from('thoughts').delete().in('id',ids).eq('user_id',_sbUser.id);}
async function sbDeleteHabit(id){if(!_sbUser)return;await sb.from('habit_entries').delete().eq('habit_id',id).eq('user_id',_sbUser.id);await sb.from('habits').delete().eq('id',id).eq('user_id',_sbUser.id);}
async function sbDeleteHabits(ids){if(!_sbUser||!ids.length)return;for(var i=0;i<ids.length;i++){await sbDeleteHabit(ids[i]);}}
async function sbDeleteHabitEntry(entryId){if(!_sbUser)return;await sb.from('habit_entries').delete().eq('id',entryId).eq('user_id',_sbUser.id);}
async function sbDeleteHabitEntries(ids){if(!_sbUser||!ids.length)return;await sb.from('habit_entries').delete().in('id',ids).eq('user_id',_sbUser.id);}
