const SUPABASE_URL='https://yhhclegajyezejacendp.supabase.co';
const SUPABASE_KEY='sb_publishable_y8pAGrTaRrvvYmNZadIe2w_ayd7PFIg';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

var _sbUser=null;
var _syncInProgress=false;

async function sbInit(){
    const{data}=await sb.auth.getSession();
    if(data.session){
        _sbUser=data.session.user;
        document.getElementById('auth-overlay').classList.remove('visible');
        sbRestoreIfNeeded();
    }else{
        document.getElementById('auth-overlay').classList.add('visible');
    }
}

document.getElementById('auth-login-btn').addEventListener('click',async()=>{
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
    document.getElementById('auth-overlay').classList.remove('visible');
    sbRestoreIfNeeded();
});

document.getElementById('auth-signup-btn').addEventListener('click',async()=>{
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
    document.getElementById('auth-overlay').classList.remove('visible');
    sbFullUpload();
});

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
            captures=cloudThoughts.map(r=>({id:r.id,text:r.text,mood:r.mood,eventMood:r.event_mood,tags:r.tag?[r.tag]:[],lang:r.lang,inputType:r.input_type,aiRefined:r.ai_refined,createdAt:r.created_at}));
            saveCaptures();
        }
        const{data:cloudHabits}=await sb.from('habits').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:false});
        if(cloudHabits&&cloudHabits.length>0){
            const{data:cloudEntries}=await sb.from('habit_entries').select('*').eq('user_id',_sbUser.id).order('created_at',{ascending:true});
            var entriesByHabit={};
            (cloudEntries||[]).forEach(e=>{
                if(!entriesByHabit[e.habit_id])entriesByHabit[e.habit_id]=[];
                entriesByHabit[e.habit_id].push({id:e.id,text:e.text,title:e.title||undefined,inputType:e.input_type,lang:e.lang,aiRefined:e.ai_refined,createdAt:e.created_at});
            });
            habits=cloudHabits.map(h=>({id:h.id,name:h.name,favourite:h.favourite,createdAt:h.created_at,entries:entriesByHabit[h.id]||[]}));
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

async function sbSyncThoughts(){
    if(!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_captures')||'[]');
    if(!local.length)return;
    var rows=local.map(c=>({
        id:c.id,
        user_id:_sbUser.id,
        text:c.text,
        input_type:c.inputType||'voice',
        lang:c.lang||null,
        tag:(c.tags&&c.tags[0])||null,
        mood:c.mood||null,
        event_mood:c.eventMood||null,
        ai_refined:c.aiRefined||null,
        created_at:c.createdAt,
        updated_at:new Date().toISOString()
    }));
    const{error}=await sb.from('thoughts').upsert(rows,{onConflict:'id'});
    if(error)console.error('Thoughts sync error:',error);
}

async function sbSyncHabits(){
    if(!_sbUser)return;
    var local=JSON.parse(localStorage.getItem('speak_habits')||'[]');
    if(!local.length)return;
    var habitRows=local.map(h=>({
        id:h.id,
        user_id:_sbUser.id,
        name:h.name,
        favourite:h.favourite||false,
        created_at:h.createdAt,
        updated_at:new Date().toISOString()
    }));
    const{error:hErr}=await sb.from('habits').upsert(habitRows,{onConflict:'id'});
    if(hErr){console.error('Habits sync error:',hErr);return;}
    var entryRows=[];
    local.forEach(h=>{
        (h.entries||[]).forEach(e=>{
            entryRows.push({
                id:e.id,
                habit_id:h.id,
                user_id:_sbUser.id,
                text:e.text,
                title:e.title||null,
                input_type:e.inputType||'voice',
                lang:e.lang||null,
                ai_refined:e.aiRefined||null,
                created_at:e.createdAt,
                updated_at:new Date().toISOString()
            });
        });
    });
    if(entryRows.length){
        const{error:eErr}=await sb.from('habit_entries').upsert(entryRows,{onConflict:'id'});
        if(eErr)console.error('Habit entries sync error:',eErr);
    }
}

async function sbDeleteThought(id){
    if(!_sbUser)return;
    await sb.from('thoughts').delete().eq('id',id).eq('user_id',_sbUser.id);
}

async function sbDeleteThoughts(ids){
    if(!_sbUser||!ids.length)return;
    await sb.from('thoughts').delete().in('id',ids).eq('user_id',_sbUser.id);
}

async function sbDeleteHabit(id){
    if(!_sbUser)return;
    await sb.from('habit_entries').delete().eq('habit_id',id).eq('user_id',_sbUser.id);
    await sb.from('habits').delete().eq('id',id).eq('user_id',_sbUser.id);
}

async function sbDeleteHabits(ids){
    if(!_sbUser||!ids.length)return;
    for(var i=0;i<ids.length;i++){await sbDeleteHabit(ids[i]);}
}

async function sbDeleteHabitEntry(entryId){
    if(!_sbUser)return;
    await sb.from('habit_entries').delete().eq('id',entryId).eq('user_id',_sbUser.id);
}

async function sbDeleteHabitEntries(ids){
    if(!_sbUser||!ids.length)return;
    await sb.from('habit_entries').delete().in('id',ids).eq('user_id',_sbUser.id);
}
