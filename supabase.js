const SUPABASE_URL='https://yhhclegajyezejacendp.supabase.co';
const SUPABASE_KEY='sb_publishable_y8pAGrTaRrvvYmNZadIe2w_ayd7PFIg';
var sb=null;
try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);}catch(e){console.warn('Supabase client init failed — app will work offline only.',e);}

var _sbUser=null;
var _syncInProgress=false;

async function sbInit(){
    if(!sb){console.warn('Supabase not available — skipping auth');return;}
    try{
        const{data,error}=await sb.auth.getSession();
        if(error){console.error('Auth init error:',error);document.getElementById('auth-overlay').classList.add('visible');return;}
        if(data.session){
            _sbUser=data.session.user;
            if(typeof encInitFromStorage==='function')await encInitFromStorage();
            document.getElementById('auth-overlay').classList.remove('visible');
            sbRestoreIfNeeded();
        }else{
            document.getElementById('auth-overlay').classList.add('visible');
        }
    }catch(err){
        console.error('sbInit failed:',err);
        if(typeof showToast==='function')showToast('Cloud sync unavailable');
    }
}

(function(){
    var loginBtn=document.getElementById('auth-login-btn');
    var signupBtn=document.getElementById('auth-signup-btn');
    if(loginBtn)loginBtn.addEventListener('click',async()=>{
        if(!sb)return;
        var email=document.getElementById('auth-email').value.trim();
        var pass=document.getElementById('auth-password').value;
        var errEl=document.getElementById('auth-error');
        errEl.style.display='none';
        if(!email||!pass){errEl.textContent='Please enter email and password.';errEl.style.display='block';return;}
        var btn=document.getElementById('auth-login-btn');
        btn.textContent='Signing in...';btn.disabled=true;
        const{data,error}=await sb.auth.signInWithPassword({email,password:pass});
        if(error){errEl.textContent=error.message;errEl.style.display='block';btn.textContent='Sign in';btn.disabled=false;return;}
        _sbUser=data.user;
        if(typeof encDeriveKey==='function')await encDeriveKey(pass,_sbUser.id);
        document.getElementById('auth-overlay').classList.remove('visible');
        sbRestoreIfNeeded();
    });
    if(signupBtn)signupBtn.addEventListener('click',async()=>{
        if(!sb)return;
        var email=document.getElementById('auth-email').value.trim();
        var pass=document.getElementById('auth-password').value;
        var errEl=document.getElementById('auth-error');
        errEl.style.display='none';
        if(!email||!pass){errEl.textContent='Please enter email and password.';errEl.style.display='block';return;}
        if(pass.length<6){errEl.textContent='Password must be at least 6 characters.';errEl.style.display='block';return;}
        var btn=document.getElementById('auth-signup-btn');
        btn.textContent='Creating account...';btn.disabled=true;
        const{data,error}=await sb.auth.signUp({email,password:pass});
        if(error){errEl.textContent=error.message;errEl.style.display='block';btn.textContent='No account? Create one';btn.disabled=false;return;}
        _sbUser=data.user;
        if(typeof encDeriveKey==='function')await encDeriveKey(pass,_sbUser.id);
        document.getElementById('auth-overlay').classList.remove('visible');
        sbFullUpload();
    });
    var forgotBtn=document.getElementById('auth-forgot-btn');
    if(forgotBtn)forgotBtn.addEventListener('click',async()=>{
        var email=document.getElementById('auth-email').value.trim();
        if(!email){var errEl=document.getElementById('auth-error');errEl.textContent='Enter your email first, then tap Forgot password.';errEl.style.display='block';return;}
        var confirmed=confirm('WARNING: Resetting your password will make all your existing encrypted data permanently unrecoverable. You will start fresh.\n\nSend password reset email to '+email+'?');
        if(!confirmed)return;
        var{error}=await sb.auth.resetPasswordForEmail(email);
        if(error){var errEl=document.getElementById('auth-error');errEl.textContent=error.message;errEl.style.display='block';return;}
        alert('Password reset email sent to '+email+'. Check your inbox.');
    });
})();

async function sbRestoreIfNeeded(){
    if(!sb||!_sbUser)return;
    var localThoughts=JSON.parse(localStorage.getItem('speak_captures')||'[]');
    var localHabits=JSON.parse(localStorage.getItem('speak_habits')||'[]');
    if(localThoughts.length===0&&localHabits.length===0){
        await sbRestoreFromCloud();
    }else{
        await sbFullUpload();
        if(_encKey&&!localStorage.getItem('speak_enc_migrated')){
            localStorage.setItem('speak_enc_migrated','1');
            if(typeof showToast==='function')showToast('Data encrypted successfully');
        }
    }
}

async function sbRestoreFromCloud(){
    if(!sb||!_sbUser)return;
    try{
        const{data:cloudThoughts}=await sb.from('thoughts').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:false});
        if(cloudThoughts&&cloudThoughts.length>0){
            var dec=typeof encDecrypt==='function'?encDecrypt:function(v){return Promise.resolve(v);};
            captures=[];
            for(var i=0;i<cloudThoughts.length;i++){
                var r=cloudThoughts[i];
                captures.push({id:r.id,text:await dec(r.text),mood:r.mood,eventMood:r.event_mood,tags:r.tag?[r.tag]:[],lang:r.lang,inputType:r.input_type,aiRefined:await dec(r.ai_refined),createdAt:r.created_at});
            }
            saveCaptures();
        }
        const{data:cloudHabits}=await sb.from('habits').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:false});
        if(cloudHabits&&cloudHabits.length>0){
            const{data:cloudEntries}=await sb.from('habit_entries').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:true});
            var dec=typeof encDecrypt==='function'?encDecrypt:function(v){return Promise.resolve(v);};
            var entriesByHabit={};
            for(var i=0;i<(cloudEntries||[]).length;i++){
                var e=cloudEntries[i];
                if(!entriesByHabit[e.habit_id])entriesByHabit[e.habit_id]=[];
                entriesByHabit[e.habit_id].push({id:e.id,text:await dec(e.text),title:await dec(e.title)||undefined,inputType:e.input_type,lang:e.lang,aiRefined:await dec(e.ai_refined),createdAt:e.created_at});
            }
            habits=[];
            for(var i=0;i<cloudHabits.length;i++){
                var h=cloudHabits[i];
                habits.push({id:h.id,name:await dec(h.name),favourite:h.favourite,createdAt:h.created_at,entries:entriesByHabit[h.id]||[]});
            }
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
    if(!sb||!_sbUser||_syncInProgress)return;
    _syncInProgress=true;
    try{
        await sbSyncThoughts();
        await sbSyncHabits();
    }catch(err){
        console.error('Full upload failed:',err);
    }
    _syncInProgress=false;
}

async function sbSyncThoughts(){
    if(!sb||!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_captures')||'[]');
    if(!local.length)return;
    var rows=[];
    for(var i=0;i<local.length;i++){
        var c=local[i];
        rows.push({
            id:c.id,
            user_id:_sbUser.id,
            text:typeof encEncrypt==='function'?await encEncrypt(c.text):c.text,
            input_type:c.inputType||'voice',
            lang:c.lang||null,
            tag:(c.tags&&c.tags[0])||null,
            mood:c.mood||null,
            event_mood:c.eventMood||null,
            ai_refined:typeof encEncrypt==='function'?await encEncrypt(c.aiRefined||null):c.aiRefined||null,
            created_at:c.createdAt,
            updated_at:new Date().toISOString()
        });
    }
    const{error}=await sb.from('thoughts').upsert(rows,{onConflict:'id'});
    if(error){console.error('Thoughts sync error:',error);if(typeof showToast==='function')showToast('Sync error: '+error.message);}
}

async function sbSyncHabits(){
    if(!sb||!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_habits')||'[]');
    if(!local.length)return;
    var habitRows=[];
    for(var i=0;i<local.length;i++){
        var h=local[i];
        habitRows.push({
            id:h.id,
            user_id:_sbUser.id,
            name:typeof encEncrypt==='function'?await encEncrypt(h.name):h.name,
            favourite:h.favourite||false,
            created_at:h.createdAt,
            updated_at:new Date().toISOString()
        });
    }
    const{error:hErr}=await sb.from('habits').upsert(habitRows,{onConflict:'id'});
    if(hErr){console.error('Habits sync error:',hErr);if(typeof showToast==='function')showToast('Sync error: '+hErr.message);return;}
    var entryRows=[];
    for(var i=0;i<local.length;i++){
        var h=local[i];
        var entries=h.entries||[];
        for(var j=0;j<entries.length;j++){
            var e=entries[j];
            entryRows.push({
                id:e.id,
                habit_id:h.id,
                user_id:_sbUser.id,
                text:typeof encEncrypt==='function'?await encEncrypt(e.text):e.text,
                title:typeof encEncrypt==='function'?await encEncrypt(e.title||null):e.title||null,
                input_type:e.inputType||'voice',
                lang:e.lang||null,
                ai_refined:typeof encEncrypt==='function'?await encEncrypt(e.aiRefined||null):e.aiRefined||null,
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

async function sbDeleteThought(id){
    if(!sb||!_sbUser)return;
    await sb.from('thoughts').delete().eq('id',id).eq('user_id',_sbUser.id);
}

async function sbDeleteThoughts(ids){
    if(!sb||!_sbUser||!ids.length)return;
    await sb.from('thoughts').delete().in('id',ids).eq('user_id',_sbUser.id);
}

async function sbDeleteHabit(id){
    if(!sb||!_sbUser)return;
    await sb.from('habit_entries').delete().eq('habit_id',id).eq('user_id',_sbUser.id);
    await sb.from('habits').delete().eq('id',id).eq('user_id',_sbUser.id);
}

async function sbDeleteHabits(ids){
    if(!sb||!_sbUser||!ids.length)return;
    for(var i=0;i<ids.length;i++){await sbDeleteHabit(ids[i]);}
}

async function sbDeleteHabitEntry(entryId){
    if(!sb||!_sbUser)return;
    await sb.from('habit_entries').delete().eq('id',entryId).eq('user_id',_sbUser.id);
}

async function sbDeleteHabitEntries(ids){
    if(!sb||!_sbUser||!ids.length)return;
    await sb.from('habit_entries').delete().in('id',ids).eq('user_id',_sbUser.id);
}
