/* ============ HABITS SYSTEM ============ */
let currentHabitId=null,currentHabitEntryId=null;
let habitsSelectMode=false,habitsSelected=new Set();
let habitEntriesSelectMode=false,habitEntriesSelected=new Set();

function updateHabitsBar(){
    const n=habitsSelected.size;
    document.getElementById('habits-select-count').textContent=n+' selected';
    document.getElementById('habits-select-bar').classList.toggle('visible',n>0||habitsSelectMode);
}
function exitHabitsSelection(){
    habitsSelectMode=false;habitsSelected.clear();
    document.getElementById('habits-select-bar').classList.remove('visible');
    renderHabits();
}
function enterHabitsSelection(id){
    habitsSelectMode=true;habitsSelected.add(id);
    renderHabits();
    updateHabitsBar();
}

function updateHabitEntriesBar(){
    const n=habitEntriesSelected.size;
    document.getElementById('habit-entries-select-count').textContent=n+' selected';
    document.getElementById('habit-entries-select-bar').classList.toggle('visible',n>0||habitEntriesSelectMode);
}
function exitHabitEntriesSelection(){
    habitEntriesSelectMode=false;habitEntriesSelected.clear();
    document.getElementById('habit-entries-select-bar').classList.remove('visible');
    openHabitDetail(currentHabitId);
}
function enterHabitEntriesSelection(id){
    habitEntriesSelectMode=true;habitEntriesSelected.add(id);
    openHabitDetail(currentHabitId);
    updateHabitEntriesBar();
}


function getStreakMsg(habit){
    if(!habit.entries||habit.entries.length===0)return{streak:'',inactivity:'',daysSince:-1};
    const now=new Date(),entries=habit.entries.map(e=>new Date(e.createdAt));
    entries.sort((a,b)=>b-a);
    const lastEntry=entries[0];
    const daysSinceLast=Math.floor((now-lastEntry)/(1000*60*60*24));
    
    /* Inactivity - gentle, rolling days */
    let inactivity='';
    if(daysSinceLast>=2)inactivity='\ud83d\udca4 '+daysSinceLast+' days';
    
    /* Streak - rolling 7 day window */
    let streak='';
    const sevenDaysAgo=new Date(now.getTime()-7*24*60*60*1000);
    const recentEntries=entries.filter(e=>e>=sevenDaysAgo).length;
    
    /* Check consecutive days */
    let consecutiveDays=1;
    const uniqueDays=[...new Set(entries.map(e=>{const d=new Date(e);d.setHours(0,0,0,0);return d.getTime();}))].sort((a,b)=>b-a);
    for(let i=1;i<uniqueDays.length;i++){
        const diff=(uniqueDays[i-1]-uniqueDays[i])/(1000*60*60*24);
        if(diff===1)consecutiveDays++;else break;
    }
    
    if(consecutiveDays>=7)streak='7 days in a row! \ud83d\udd25';
    else if(consecutiveDays>=5)streak=consecutiveDays+' days in a row \ud83d\udd25';
    else if(consecutiveDays>=3)streak=consecutiveDays+' days in a row — keep going!';
    else if(recentEntries>=5)streak=recentEntries+' times in the last 7 days \ud83d\udd25';
    else if(recentEntries>=3)streak='Active '+recentEntries+' times past week';
    else if(daysSinceLast===0)streak='Logged today \u2713';
    else if(daysSinceLast===1)streak='Logged yesterday';
    
    return{streak,inactivity,daysSince:daysSinceLast};
}

function renderHabits(){
    const list=document.getElementById('habits-list');
    if(!habits.length){
        list.innerHTML='<div class="empty-state"><div class="empty-state-icon" style="font-size:40px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--text-muted)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5"/><path d="M12 22c-2 0-3-1-3-3"/><path d="M12 22c2 0 3-1 3-3"/></svg></div><div class="empty-state-text">No habits yet.<br>Tap + Add habit to start tracking.</div></div>';
        return;
    }
    const sorted=[...habits].sort((a,b)=>{if(a.favourite&&!b.favourite)return -1;if(!a.favourite&&b.favourite)return 1;return 0;});
    let h='';
    sorted.forEach(hab=>{
        const msgs=getStreakMsg(hab);
        const entryCount=hab.entries?hab.entries.length:0;
        const lastEntry=entryCount>0?formatDate(new Date(hab.entries[hab.entries.length-1].createdAt)):'No entries yet';
        const starColor=hab.favourite?'#5e8a5a':'var(--text-muted)';
        const starFill=hab.favourite?'#5e8a5a':'none';
        const starOpacity=hab.favourite?'1':'0.4';
        const isHabSel=habitsSelected.has(hab.id);
        h+='<div class="capture-card habit-card'+(isHabSel?' selected':'')+'" data-habit-id="'+hab.id+'">';
        h+='<div class="capture-card-header"><div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">';
        h+='<div class="select-checkbox">'+CHECKBOX_SVG+'</div>';
        h+='<div class="capture-card-date" style="font-size:15px;font-weight:600;color:var(--text-primary);">'+escapeHtml(hab.name)+'</div></div>';
        h+='<div class="card-actions" style="display:flex;gap:6px;align-items:center;'+(habitsSelectMode?'visibility:hidden;':'')+'">';
        h+='<button class="habit-edit-btn" data-habit-id="'+hab.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>';
        h+='<button class="habit-delete-btn" data-habit-id="'+hab.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
        h+='<button class="habit-fav-btn" data-habit-id="'+hab.id+'" style="background:none;border:none;cursor:pointer;padding:4px;opacity:'+starOpacity+';" title="Favourite"><svg viewBox="0 0 24 24" width="18" height="18" fill="'+starFill+'" stroke="'+starColor+'" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>';
        h+='</div></div>';
        if(msgs.streak)h+='<div style="font-size:12px;color:var(--accent-moss);margin-top:4px;">'+msgs.streak+'</div>';
        if(msgs.inactivity)h+='<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">'+msgs.inactivity+'</div>';
        h+='<div class="capture-card-text" style="font-size:12px;color:var(--text-muted);margin-top:6px;">'+entryCount+' entries \u00b7 '+lastEntry+'</div>';
        h+='</div>';
    });
    list.innerHTML=h;
    list.querySelectorAll('.habit-card').forEach(card=>{
        let lpTimer=null;
        card.addEventListener('touchstart',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!habitsSelectMode)enterHabitsSelection(card.dataset.habitId);},700);},{passive:true});
        card.addEventListener('touchend',()=>clearTimeout(lpTimer),{passive:true});
        card.addEventListener('touchmove',()=>clearTimeout(lpTimer),{passive:true});
        card.addEventListener('mousedown',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!habitsSelectMode)enterHabitsSelection(card.dataset.habitId);},700);});
        card.addEventListener('mouseup',()=>clearTimeout(lpTimer));
        card.addEventListener('click',e=>{
            if(e.target.closest('.habit-delete-btn')||e.target.closest('.habit-fav-btn')||e.target.closest('.habit-edit-btn'))return;
            if(habitsSelectMode){
                if(habitsSelected.has(card.dataset.habitId))habitsSelected.delete(card.dataset.habitId);
                else habitsSelected.add(card.dataset.habitId);
                card.classList.toggle('selected',habitsSelected.has(card.dataset.habitId));
                updateHabitsBar();
                return;
            }
            openHabitDetail(card.dataset.habitId);
        });
    });
    list.querySelectorAll('.habit-edit-btn').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation();
            const hab=habits.find(h=>h.id===btn.dataset.habitId);
            if(!hab)return;
            const newName=prompt('Rename habit:',hab.name);
            if(newName&&newName.trim()){hab.name=newName.trim();saveHabits();renderHabits();}
        });
    });
    list.querySelectorAll('.habit-delete-btn').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation();
            currentHabitId=btn.dataset.habitId;
            document.getElementById('delete-habit-overlay').classList.add('visible');
            pushNav('delete-habit-overlay');
        });
    });
    list.querySelectorAll('.habit-fav-btn').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation();
            const hab=habits.find(h=>h.id===btn.dataset.habitId);
            if(hab){hab.favourite=!hab.favourite;saveHabits();renderHabits();}
        });
    });
    list.classList.toggle('selecting',habitsSelectMode);
}


function openHabitDetail(id){
    const hab=habits.find(h=>h.id===id);
    if(!hab)return;
    currentHabitId=id;
    document.getElementById('habit-detail-name').textContent=hab.name;
    const msgs=getStreakMsg(hab);
    document.getElementById('habit-streak-msg').textContent=msgs.streak;
    const inEl=document.getElementById('habit-inactivity-msg');
    inEl.textContent=msgs.inactivity;
    inEl.style.color=msgs.inactivity.includes('week')?'var(--mood-1)':'var(--mood-2)';
    
    const list=document.getElementById('habit-entries-list');
    /* Sort: starred first, then newest */
    const entries=(hab.entries||[]).slice().sort((a,b)=>{
        if(a.starred&&!b.starred)return -1;if(!a.starred&&b.starred)return 1;
        return new Date(b.createdAt)-new Date(a.createdAt);
    });
    if(!entries.length){
        list.innerHTML='<div class="empty-state"><div class="empty-state-text">No entries yet. Use the button below to log.</div></div>';
    }else{
        let h='';
        entries.forEach(e=>{
            const d=new Date(e.createdAt);
            const inputIcon=e.inputType==='text'?'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#5e8a5a" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>':'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#5e8a5a" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>';
            const starColor=e.starred?'#5e8a5a':'var(--text-muted)';
            const starFill=e.starred?'#5e8a5a':'none';
            const starOpacity=e.starred?'1':'0.4';
            const isEntrySel=habitEntriesSelected.has(e.id);
            h+='<div class="capture-card habit-entry-card'+(isEntrySel?' selected':'')+'" data-entry-id="'+e.id+'">';
            h+='<div class="capture-card-header"><div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">';
            h+='<div class="select-checkbox">'+CHECKBOX_SVG+'</div>';
            h+='<div class="capture-card-date">'+formatDate(d)+inputIcon+'</div></div>';
            h+='<div class="card-actions" style="display:flex;gap:6px;align-items:center;'+(habitEntriesSelectMode?'visibility:hidden;':'')+'">';
            h+='<button class="entry-edit-btn" data-entry-id="'+e.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>';
            h+='<button class="entry-delete-btn" data-entry-id="'+e.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
            h+='<button class="entry-star-btn" data-entry-id="'+e.id+'" style="background:none;border:none;cursor:pointer;padding:4px;opacity:'+starOpacity+';" title="Star"><svg viewBox="0 0 24 24" width="18" height="18" fill="'+starFill+'" stroke="'+starColor+'" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>';
            h+='</div></div>';
            h+='<div class="capture-card-text">'+escapeHtml(e.text.substring(0,150))+(e.text.length>150?'...':'')+'</div>';
            h+='</div>';
        });
        list.innerHTML=h;
        list.querySelectorAll('.habit-entry-card').forEach(card=>{
            let lpTimer=null;
            card.addEventListener('touchstart',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!habitEntriesSelectMode)enterHabitEntriesSelection(card.dataset.entryId);},700);},{passive:true});
            card.addEventListener('touchend',()=>clearTimeout(lpTimer),{passive:true});
            card.addEventListener('touchmove',()=>clearTimeout(lpTimer),{passive:true});
            card.addEventListener('mousedown',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!habitEntriesSelectMode)enterHabitEntriesSelection(card.dataset.entryId);},700);});
            card.addEventListener('mouseup',()=>clearTimeout(lpTimer));
            card.addEventListener('click',e=>{
                if(e.target.closest('.entry-edit-btn')||e.target.closest('.entry-delete-btn')||e.target.closest('.entry-star-btn'))return;
                if(habitEntriesSelectMode){
                    if(habitEntriesSelected.has(card.dataset.entryId))habitEntriesSelected.delete(card.dataset.entryId);
                    else habitEntriesSelected.add(card.dataset.entryId);
                    card.classList.toggle('selected',habitEntriesSelected.has(card.dataset.entryId));
                    updateHabitEntriesBar();
                    return;
                }
                const entry=entries.find(x=>x.id===card.dataset.entryId);
                if(!entry)return;
                currentHabitEntryId=entry.id;
                document.getElementById('habit-entry-date').textContent=formatDate(new Date(entry.createdAt));
                document.getElementById('habit-entry-text').textContent=entry.text;
                document.getElementById('habit-entry-overlay').classList.add('visible');
                pushNav('habit-entry-overlay');
            });
        });
        list.querySelectorAll('.entry-edit-btn').forEach(btn=>{
            btn.addEventListener('click',e=>{
                e.stopPropagation();
                const entry=(hab.entries||[]).find(x=>x.id===btn.dataset.entryId);
                if(!entry)return;
                const newText=prompt('Edit entry:',entry.text);
                if(newText!==null&&newText.trim()){entry.text=newText.trim();saveHabits();openHabitDetail(id);}
            });
        });
        list.querySelectorAll('.entry-delete-btn').forEach(btn=>{
            btn.addEventListener('click',e=>{
                e.stopPropagation();
                if(confirm('Delete this entry?')){
                    hab.entries=hab.entries.filter(x=>x.id!==btn.dataset.entryId);
                    saveHabits();openHabitDetail(id);
                }
            });
        });
        list.querySelectorAll('.entry-star-btn').forEach(btn=>{
            btn.addEventListener('click',e=>{
                e.stopPropagation();
                const entry=(hab.entries||[]).find(x=>x.id===btn.dataset.entryId);
                if(entry){entry.starred=!entry.starred;saveHabits();openHabitDetail(id);}
            });
        });
        list.classList.toggle('selecting',habitEntriesSelectMode);
    }
    screens.forEach(s=>s.classList.remove('active'));
    document.getElementById('habit-detail-screen').classList.add('active');
    pushNav('habit-detail-screen');
}


/* Add Habit */
document.getElementById('add-habit-btn').addEventListener('click',()=>{
    document.getElementById('habit-name-input').value='';
    document.getElementById('add-habit-overlay').classList.add('visible');
    pushNav('add-habit-overlay');
    setTimeout(()=>document.getElementById('habit-name-input').focus(),100);
});
document.getElementById('add-habit-close-x').addEventListener('click',()=>document.getElementById('add-habit-overlay').classList.remove('visible'));
document.getElementById('add-habit-cancel').addEventListener('click',()=>document.getElementById('add-habit-overlay').classList.remove('visible'));
document.getElementById('add-habit-save').addEventListener('click',()=>{
    const name=document.getElementById('habit-name-input').value.trim();
    if(!name)return;
    habits.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),name,entries:[],favourite:false,createdAt:new Date().toISOString()});
    saveHabits();renderHabits();
    document.getElementById('add-habit-overlay').classList.remove('visible');
});

/* Delete Habit */
document.getElementById('delete-habit-cancel').addEventListener('click',()=>document.getElementById('delete-habit-overlay').classList.remove('visible'));
document.getElementById('delete-habit-confirm').addEventListener('click',()=>{
    habits=habits.filter(h=>h.id!==currentHabitId);
    saveHabits();renderHabits();
    document.getElementById('delete-habit-overlay').classList.remove('visible');
});

/* Delete Habit Entry */
document.getElementById('habit-entry-close-x').addEventListener('click',()=>document.getElementById('habit-entry-overlay').classList.remove('visible'));
document.getElementById('habit-entry-delete').addEventListener('click',()=>{
    const hab=habits.find(h=>h.id===currentHabitId);
    if(hab){hab.entries=hab.entries.filter(e=>e.id!==currentHabitEntryId);saveHabits();}
    document.getElementById('habit-entry-overlay').classList.remove('visible');
    openHabitDetail(currentHabitId);
});

/* Habit Detail Back */
document.getElementById('habit-detail-back').addEventListener('click',()=>showScreen('habits-screen'));

/* Habit Speak Button - full speak/write with long-press */
let habitLongPressTimer=null,habitIsLongPress=false,habitIsWriteMode=false,habitIsRecording=false;
const habitBtn=document.getElementById('habit-speak-btn');
const habitLpRing=document.getElementById('habit-lp-ring');

function habitEnterWriteMode(){
    habitIsWriteMode=true;habitIsLongPress=true;
    try{if(navigator.vibrate)navigator.vibrate([50]);}catch(e){}
    habitBtn.classList.add('write-mode');
    habitBtn.querySelector('.speak-btn-label').textContent='Write';
    habitBtn.querySelector('svg').innerHTML='<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    habitLpRing.classList.remove('active');
}
function habitExitWriteMode(){
    habitIsWriteMode=false;
    habitBtn.classList.remove('write-mode');
    habitBtn.querySelector('.speak-btn-label').textContent='Habit';
    habitBtn.querySelector('svg').innerHTML='<path d="M12 22V12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22c-2 0-3-1-3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 22c2 0 3-1 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
}
function habitOpenWriteModal(){
    document.getElementById('write-textarea').value='';
    var _wt=document.querySelector('#write-overlay .modal-title');if(_wt)_wt.innerHTML='Talk about your habits <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-left:4px;"><path d="M12 22V12"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5"/></svg>';
    const writeTitle=document.querySelector('#write-overlay .modal-title');
    if(writeTitle)writeTitle.innerHTML='Talk about your habits <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-left:4px;"><path d="M12 22V12"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5"/></svg>';
    document.getElementById('write-overlay').classList.add('habit-write-mode');
    document.getElementById('write-refine-preview').style.display='none';document.getElementById('write-refine-status').style.display='none';document.getElementById('write-refine-actions').style.display='none';
    if(typeof syncWriteLangToggle==='function')syncWriteLangToggle();
    document.getElementById('write-overlay').classList.add('visible');
    pushNav('write-overlay');
    window._habitDirectSave=true;
    setTimeout(()=>document.getElementById('write-textarea').focus(),100);
}
function habitSaveVoiceEntry(text){
    const hab=habits.find(h=>h.id===currentHabitId);
    if(hab&&text){
        hab.entries.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),text:cleanupTranscript(text),inputType:'voice',lang:currentLang,createdAt:new Date().toISOString()});
        saveHabits();
        openHabitDetail(currentHabitId);
    }
}

/* Habit voice recording */
let habitRecognition=null,habitFT='',habitIT='';
if(SR){
    function createHabitRecognition(){
        const r=new SR();r.continuous=!isMobile;r.interimResults=true;r.lang=currentLang;
        r.onstart=()=>{habitIsRecording=true;habitBtn.classList.add('recording');habitBtn.querySelector('.speak-btn-label').textContent='Stop';};
        r.onresult=e=>{habitIT='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)habitFT+=e.results[i][0].transcript+' ';else habitIT+=e.results[i][0].transcript;}};
        r.onerror=e=>{if(e.error==='no-speech'){if(habitIsRecording){setTimeout(()=>{try{habitRecognition.start();}catch(ex){}},100);}return;}
        if(e.error==='not-allowed'||e.error==='service-not-allowed'){habitIsRecording=false;habitBtn.classList.remove('recording');habitBtn.querySelector('.speak-btn-label').textContent='Habit';habitOpenWriteModal();return;}};
        r.onend=()=>{if(habitIsRecording){setTimeout(()=>{try{habitRecognition.start();}catch(ex){habitIsRecording=false;habitBtn.classList.remove('recording');habitBtn.querySelector('.speak-btn-label').textContent='Habit';const t=(habitFT+habitIT).trim();habitFT='';habitIT='';if(t){habitSaveVoiceEntry(t);}else{showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}}},100);return;}
        habitBtn.classList.remove('recording');habitBtn.querySelector('.speak-btn-label').textContent='Habit';
        const t=(habitFT+habitIT).trim();habitFT='';habitIT='';
        if(t){habitSaveVoiceEntry(t);}else{showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}};
        return r;
    }
    async function habitStartRecording(){habitFT='';habitIT='';
        try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());habitRecognition=createHabitRecognition();habitRecognition.lang=currentLang;habitRecognition.start();}
        catch(e){habitOpenWriteModal();}}
}

/* Long press + tap handlers */
habitBtn.addEventListener('touchstart',e=>{if(habitIsRecording)return;habitIsLongPress=false;habitLpRing.classList.add('active');habitLongPressTimer=setTimeout(()=>{habitEnterWriteMode();},800);},{passive:true});
habitBtn.addEventListener('touchend',e=>{clearTimeout(habitLongPressTimer);habitLpRing.classList.remove('active');window._habitTouchHandled=true;if(habitIsLongPress&&habitIsWriteMode){habitIsLongPress=false;habitOpenWriteModal();habitExitWriteMode();return;}habitIsLongPress=false;if(habitIsWriteMode){habitOpenWriteModal();habitExitWriteMode();return;}if(habitIsRecording){habitIsRecording=false;try{habitRecognition.stop();}catch(ex){}}else if(SR){habitStartRecording();}else{habitOpenWriteModal();}},{passive:true});
habitBtn.addEventListener('touchmove',()=>{clearTimeout(habitLongPressTimer);habitLpRing.classList.remove('active');habitIsLongPress=false;},{passive:true});
habitBtn.addEventListener('mousedown',e=>{if(habitIsRecording||e.button!==0)return;habitIsLongPress=false;habitLpRing.classList.add('active');habitLongPressTimer=setTimeout(()=>{habitEnterWriteMode();},800);});
habitBtn.addEventListener('mouseup',e=>{clearTimeout(habitLongPressTimer);habitLpRing.classList.remove('active');if(habitIsLongPress&&habitIsWriteMode){habitIsLongPress=false;habitOpenWriteModal();habitExitWriteMode();return;}habitIsLongPress=false;});
habitBtn.addEventListener('click',e=>{
    if(window._habitTouchHandled){window._habitTouchHandled=false;return;}
    if(habitIsWriteMode){habitOpenWriteModal();habitExitWriteMode();return;}
    if(habitIsRecording){habitIsRecording=false;try{habitRecognition.stop();}catch(ex){}return;}
    if(SR){habitStartRecording();}else{habitOpenWriteModal();}
});


/* Habit search */
document.getElementById('habit-search-input').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('#habits-list .habit-card').forEach(card=>{
        const name=card.querySelector('.capture-card-date').textContent.toLowerCase();
        const entries=(habits.find(h=>h.id===card.dataset.habitId)||{}).entries||[];
        const textMatch=entries.some(en=>en.text.toLowerCase().includes(q));
        card.style.display=(name.includes(q)||textMatch)?'':'none';
    });
});
_bindPickerAddNew();
/* Habit Picker (from Speak screen tag flow) */
document.getElementById('habit-picker-close-x').addEventListener('click',()=>{
    document.getElementById('habit-picker-overlay').classList.remove('visible');
    if(window._moveToHabitCapture){
        /* User cancelled move - save thought normally */
        window._moveToHabitCapture=null;
        saveCaptures();
        showScreen('thoughts-screen');renderCaptures();
    }
});

function showHabitPicker(){
    const list=document.getElementById('habit-picker-list');
    const empty=document.getElementById('habit-picker-empty');
    if(!habits.length){list.innerHTML='';empty.style.display='block';return;}
    empty.style.display='none';
    const sorted=[...habits].sort((a,b)=>{if(a.favourite&&!b.favourite)return -1;if(!a.favourite&&b.favourite)return 1;return 0;});
    list.innerHTML=sorted.map(h=>{
        const star=h.favourite?'<svg viewBox="0 0 24 24" width="14" height="14" fill="#5e8a5a" stroke="#5e8a5a" stroke-width="2" style="margin-right:8px;flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>':'';
        return '<button class="habit-picker-item" data-habit-id="'+h.id+'" style="padding:12px 16px;background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);color:var(--text-primary);font-family:var(--font-body);font-size:15px;cursor:pointer;text-align:left;transition:background .15s;display:flex;align-items:center;">'+star+escapeHtml(h.name)+'</button>';
    }).join('');
    list.querySelectorAll('.habit-picker-item').forEach(item=>{
        item.addEventListener('click',()=>{
            if(window._moveToHabitCapture){
                const c=window._moveToHabitCapture;window._moveToHabitCapture=null;
                const hab=habits.find(h=>h.id===item.dataset.habitId);
                if(hab){hab.entries.push({id:c.id,text:c.text,inputType:c.inputType||'voice',lang:c.lang||'en-US',createdAt:c.createdAt});saveHabits();captures=captures.filter(x=>x.id!==c.id);saveCaptures();}
                document.getElementById('habit-picker-overlay').classList.remove('visible');showScreen('thoughts-screen');renderCaptures();return;
            }
            currentCapture.habitId=item.dataset.habitId;
            document.getElementById('habit-picker-overlay').classList.remove('visible');
            saveCapture();
        });
    });
}
function _bindPickerAddNew(){
    const btn=document.getElementById('habit-picker-add-fixed');
    if(!btn)return;
    btn.addEventListener('click',()=>{
        document.getElementById('habit-picker-overlay').classList.remove('visible');
        document.getElementById('habit-name-input').value='';
        document.getElementById('add-habit-overlay').classList.add('visible');
        pushNav('add-habit-overlay');
        window._pickerAddHabit=true;
        setTimeout(()=>document.getElementById('habit-name-input').focus(),100);
    });
}

/* Action bar — habits overview */
document.getElementById('habits-select-cancel').addEventListener('click',exitHabitsSelection);
document.getElementById('habits-select-delete').addEventListener('click',()=>{
    if(!habitsSelected.size)return;
    habits=habits.filter(h=>!habitsSelected.has(h.id));
    saveHabits();
    exitHabitsSelection();
});

/* Action bar — habit entries */
document.getElementById('habit-entries-select-cancel').addEventListener('click',exitHabitEntriesSelection);
document.getElementById('habit-entries-select-delete').addEventListener('click',()=>{
    if(!habitEntriesSelected.size)return;
    const hab=habits.find(h=>h.id===currentHabitId);
    if(hab){hab.entries=hab.entries.filter(e=>!habitEntriesSelected.has(e.id));saveHabits();}
    exitHabitEntriesSelection();
});
