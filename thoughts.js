function saveCapture(){
const entry={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),text:currentCapture.text,mood:currentCapture.mood,eventMood:currentCapture.eventMood||null,tags:currentCapture.tags,lang:currentCapture.lang||currentLang,inputType:currentCapture.inputType||'voice',createdAt:new Date().toISOString()};
if(currentCapture.habitId){
    const hab=habits.find(h=>h.id===currentCapture.habitId);
    if(hab){hab.entries.push(entry);saveHabits();}
    currentCapture.habitId=null;
}else if(currentCapture.tags&&currentCapture.tags.includes('habit')){
    /* Tagged as habit but no specific habit selected yet - save to thoughts for now */
    captures.unshift(entry);
}else{
    captures.unshift(entry);
}saveCaptures();const o=document.getElementById('success-overlay');o.classList.add('visible');createParticles();setTimeout(()=>{o.classList.remove('visible');showScreen('speak-screen');currentCapture={text:'',mood:null,tags:[],inputType:'voice'};},1600);}
function createParticles(){const c=['#5b9ec4','#8ab88a','#b8a9cc','#c4956b','#6aaa8a'];for(let i=0;i<12;i++){const p=document.createElement('div');p.className='particle';p.style.background=c[Math.floor(Math.random()*c.length)];p.style.left='50%';p.style.top='50%';const a=(Math.PI*2*i)/12,d=80+Math.random()*60;p.style.setProperty('--tx',Math.cos(a)*d+'px');p.style.setProperty('--ty',Math.sin(a)*d+'px');p.style.animation='particleFly .8s cubic-bezier(.25,.46,.45,.94) forwards';p.style.animationDelay=Math.random()*.2+'s';document.body.appendChild(p);setTimeout(()=>p.remove(),1200);}}

let thoughtsSelectMode=false,thoughtsSelected=new Set();
const CHECKBOX_SVG='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--bg-deep)" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';

function updateThoughtsBar(){
    const n=thoughtsSelected.size;
    document.getElementById('thoughts-select-count').textContent=n+' selected';
    document.getElementById('thoughts-select-bar').classList.toggle('visible',n>0||thoughtsSelectMode);
}
function exitThoughtsSelection(){
    thoughtsSelectMode=false;thoughtsSelected.clear();
    document.getElementById('thoughts-select-bar').classList.remove('visible');
    renderCaptures();
}
function enterThoughtsSelection(id){
    thoughtsSelectMode=true;thoughtsSelected.add(id);
    renderCaptures();
    updateThoughtsBar();
}

function renderCaptures(){const list=document.getElementById('capture-list');let f=[...captures];if(currentFilter==='untagged')f=f.filter(c=>!c.tags||c.tags.length===0);else if(currentFilter!=='all')f=f.filter(c=>c.tags&&c.tags.includes(currentFilter));if(currentMoodFilter>0)f=f.filter(c=>c.mood===currentMoodFilter);const dr=document.getElementById('date-range-start').value;const dre=document.getElementById('date-range-end').value;if(dr){const ds=new Date(dr);ds.setHours(0,0,0,0);f=f.filter(c=>new Date(c.createdAt)>=ds);}if(dre){const de=new Date(dre);de.setHours(23,59,59,999);f=f.filter(c=>new Date(c.createdAt)<=de);}f.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(!f.length){list.innerHTML='<div class="empty-state"><div class="empty-state-icon">\u2728</div><div class="empty-state-text">No thoughts yet.<br>Tap the circle below to begin.</div></div>';return;}
let h='';f.forEach(c=>{const d=new Date(c.createdAt);const moods={1:'\ud83d\ude14',2:'\ud83d\ude15',3:'\ud83d\ude10',4:'\ud83d\ude0a',5:'\ud83d\ude04'};const me=c.mood?moods[c.mood]||'':'';const pv=c.text.substring(0,120);let tg='';if(c.tags&&c.tags.length)tg=c.tags.map(t=>'<span class="capture-tag">'+t+'</span>').join('');
const inputIcon=c.inputType==='text'?'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>':'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>';
const isSel=thoughtsSelected.has(c.id);
h+='<div class="capture-card'+(isSel?' selected':'')+'" data-id="'+c.id+'">';
h+='<div class="capture-card-header"><div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">';
h+='<div class="select-checkbox">'+CHECKBOX_SVG+'</div>';
h+='<div class="capture-card-date">'+formatDate(d)+' '+inputIcon+'</div></div>';
h+='<div class="card-actions" style="display:flex;gap:6px;align-items:center;'+(thoughtsSelectMode?'visibility:hidden;':'')+'">';
h+='<button class="card-edit-btn" data-id="'+c.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>';
h+='<button class="card-delete-btn" data-id="'+c.id+'" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
h+='</div></div>';
h+='<div class="capture-card-text">'+escapeHtml(pv)+(c.text.length>pv.length?'...':'')+'</div>';
h+='<div class="capture-card-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">';
h+='<div class="capture-card-tags">'+tg+'</div>';
var eme=c.eventMood?moods[c.eventMood]||'':'';
if(me||eme)h+='<div style="display:flex;gap:4px;font-size:16px;">'+(me?'<span title="General mood">'+me+'</span>':'')+(eme?'<span title="Event mood" style="opacity:.7;">'+eme+'</span>':'')+'</div>';
h+='</div></div>';
});list.innerHTML=h;
list.querySelectorAll('.capture-card').forEach(card=>{
    let lpTimer=null;
    card.addEventListener('touchstart',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!thoughtsSelectMode)enterThoughtsSelection(card.dataset.id);},700);},{passive:true});
    card.addEventListener('touchend',()=>clearTimeout(lpTimer),{passive:true});
    card.addEventListener('touchmove',()=>clearTimeout(lpTimer),{passive:true});
    card.addEventListener('mousedown',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!thoughtsSelectMode)enterThoughtsSelection(card.dataset.id);},700);});
    card.addEventListener('mouseup',()=>clearTimeout(lpTimer));
    card.addEventListener('click',e=>{
        if(e.target.closest('.card-edit-btn')||e.target.closest('.card-delete-btn'))return;
        if(thoughtsSelectMode){
            if(thoughtsSelected.has(card.dataset.id))thoughtsSelected.delete(card.dataset.id);
            else thoughtsSelected.add(card.dataset.id);
            card.classList.toggle('selected',thoughtsSelected.has(card.dataset.id));
            updateThoughtsBar();
            return;
        }
        openDetail(card.dataset.id);
    });
});
list.querySelectorAll('.card-edit-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();openEditFromCard(btn.dataset.id);});
});
list.querySelectorAll('.card-delete-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();openDeleteFromCard(btn.dataset.id);});
});
list.classList.toggle('selecting',thoughtsSelectMode);
}

document.getElementById('thoughts-select-cancel').addEventListener('click',exitThoughtsSelection);
document.getElementById('thoughts-select-delete').addEventListener('click',()=>{
    if(!thoughtsSelected.size)return;
    captures=captures.filter(c=>!thoughtsSelected.has(c.id));
    saveCaptures();
    exitThoughtsSelection();
});
function getDateGroup(d){const t=new Date(),y=new Date(t);y.setDate(y.getDate()-1);if(d.toDateString()===t.toDateString())return'Today';if(d.toDateString()===y.toDateString())return'Yesterday';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}

document.querySelectorAll('.filter-chip').forEach(chip=>{chip.addEventListener('click',()=>{document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');currentFilter=chip.dataset.filter;renderCaptures();});});
document.querySelectorAll('.view-toggle-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.view-toggle-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentView=btn.dataset.view;renderCaptures();});});
document.getElementById('search-input').addEventListener('input',e=>{searchQuery=e.target.value;renderCaptures();});
let dateFilterStart=null,dateFilterEnd=null;
document.getElementById('date-picker-btn').addEventListener('click',()=>{
const ov=document.getElementById('date-range-overlay');
document.getElementById('date-range-start').value=dateFilterStart||'';
document.getElementById('date-range-end').value=dateFilterEnd||'';
ov.classList.add('visible');pushNav('date-range-overlay');});
document.getElementById('date-range-close-x').addEventListener('click',()=>document.getElementById('date-range-overlay').classList.remove('visible'));
document.getElementById('date-range-clear').addEventListener('click',()=>{dateFilterStart=null;dateFilterEnd=null;currentDateFilter=null;document.getElementById('date-picker-btn').classList.remove('active');document.getElementById('date-range-overlay').classList.remove('visible');renderCaptures();});
document.getElementById('date-range-select').addEventListener('click',()=>{
dateFilterStart=document.getElementById('date-range-start').value||null;
dateFilterEnd=document.getElementById('date-range-end').value||null;
if(dateFilterStart||dateFilterEnd){document.getElementById('date-picker-btn').classList.add('active');currentDateFilter='range';}
else{document.getElementById('date-picker-btn').classList.remove('active');currentDateFilter=null;}
document.getElementById('date-range-overlay').classList.remove('visible');renderCaptures();});
const mfBtn=document.getElementById('mood-filter-btn'),mfOvl=document.getElementById('mood-filter-overlay');
mfBtn.addEventListener('click',()=>{mfOvl.classList.add('visible');pushNav('mood-filter-overlay');});
document.getElementById('mood-modal-close').addEventListener('click',()=>mfOvl.classList.remove('visible'));
document.getElementById('mood-modal-close-x').addEventListener('click',()=>mfOvl.classList.remove('visible'));
document.querySelectorAll('.mood-filter-opt').forEach(btn=>{btn.addEventListener('click',()=>{currentMoodFilter=parseInt(btn.dataset.mood);if(currentMoodFilter>0){mfBtn.innerHTML=MOODS[currentMoodFilter];mfBtn.classList.add('active');}else{mfBtn.innerHTML=SMILEY_SVG;mfBtn.classList.remove('active');}mfOvl.classList.remove('visible');renderCaptures();});});


function openEditFromCard(id){
    currentDetailId=id;
    const c=captures.find(x=>x.id===id);if(!c)return;
    document.getElementById('edit-text-input').value=c.text;
    document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(b=>{b.classList.toggle('selected',c.mood&&parseInt(b.dataset.mood)===c.mood);});
    document.querySelectorAll('#edit-tag-row .edit-tag-btn').forEach(b=>{b.classList.toggle('selected',c.tags&&c.tags.includes(b.dataset.tag));});
    document.getElementById('edit-modal').classList.add('visible');pushNav('edit-modal');
}
function openDeleteFromCard(id){
    currentDetailId=id;
    document.getElementById('confirm-overlay').classList.add('visible');pushNav('confirm-overlay');
}
function openDetail(id){const c=captures.find(x=>x.id===id);if(!c)return;currentDetailId=id;document.getElementById('detail-date').innerHTML=formatDate(new Date(c.createdAt))+' '+(c.inputType==='text'?'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>':'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>');document.getElementById('detail-mood').textContent=c.mood?MOODS[c.mood]:'';document.getElementById('detail-event-mood').textContent=c.eventMood?MOODS[c.eventMood]:'';document.getElementById('detail-text').textContent=c.text;const tc=document.getElementById('detail-tags');tc.innerHTML=(c.tags&&c.tags.length>0)?c.tags.map(t=>'<span class="tag-pill '+t+'">'+({emotion:'Thought',poem:'Poetry',habit:'Habit'}[t]||t.charAt(0).toUpperCase()+t.slice(1))+'</span>').join(''):'<span class="tag-pill untagged">⌛</span>';screens.forEach(s=>s.classList.remove('active'));document.getElementById('detail-screen').classList.add('active');pushNav('detail-screen');}
document.getElementById('detail-back').addEventListener('click',()=>showScreen('thoughts-screen'));
document.getElementById('detail-delete').addEventListener('click',()=>{document.getElementById('confirm-overlay').classList.add('visible');pushNav('confirm-overlay');});
document.getElementById('confirm-cancel').addEventListener('click',()=>document.getElementById('confirm-overlay').classList.remove('visible'));
document.getElementById('confirm-close-x').addEventListener('click',()=>document.getElementById('confirm-overlay').classList.remove('visible'));
document.getElementById('confirm-action').addEventListener('click',()=>{captures=captures.filter(c=>c.id!==currentDetailId);saveCaptures();document.getElementById('confirm-overlay').classList.remove('visible');showScreen('thoughts-screen');});
document.getElementById('detail-edit').addEventListener('click',()=>{const c=captures.find(x=>x.id===currentDetailId);if(!c)return;document.getElementById('edit-title-input').style.display='none';document.getElementById('edit-text-input').value=c.text;document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.mood)===(c.mood||0)));document.querySelectorAll('.edit-event-mood-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.mood)===(c.eventMood||0)));document.querySelectorAll('#edit-tag-row .edit-tag-btn').forEach(b=>b.classList.toggle('selected',c.tags&&c.tags.includes(b.dataset.tag)));document.getElementById('edit-modal').classList.add('visible');pushNav('edit-modal');});
document.getElementById('edit-cancel').addEventListener('click',()=>{document.getElementById('edit-title-input').style.display='none';document.getElementById('edit-modal').classList.remove('visible');});
document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');});});
document.querySelectorAll('.edit-event-mood-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.edit-event-mood-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');});});
document.querySelectorAll('#edit-tag-row .edit-tag-btn').forEach(btn=>{btn.addEventListener('click',()=>btn.classList.toggle('selected'));});
document.getElementById('edit-save').addEventListener('click',()=>{
if(window._heEditMode){
    window._heEditMode=false;
    var hab=habits.find(function(h){return h.id===currentHabitId;});
    if(!hab)return;
    var entry=(hab.entries||[]).find(function(e){return e.id===currentHabitEntryId;});
    if(!entry)return;
    entry.text=document.getElementById('edit-text-input').value;
    var etVal=document.getElementById('edit-title-input').value.trim();
    entry.title=etVal||undefined;
    document.getElementById('edit-title-input').style.display='none';
    saveHabits();document.getElementById('edit-modal').classList.remove('visible');
    openHabitEntryDetail(entry);return;
}
const c=captures.find(x=>x.id===currentDetailId);if(!c)return;c.text=document.getElementById('edit-text-input').value;const sm=document.querySelector('#edit-mood-row .edit-mood-btn.selected');c.mood=sm?(parseInt(sm.dataset.mood)||null):null;const sem=document.querySelector('.edit-event-mood-btn.selected');c.eventMood=sem?(parseInt(sem.dataset.mood)||null):null;const st=[];document.querySelectorAll('#edit-tag-row .edit-tag-btn.selected').forEach(b=>st.push(b.dataset.tag));c.tags=st;
/* If habit tag added, move to habit */
if(st.includes('habit')&&!(c._wasHabit)){
    document.getElementById('edit-modal').classList.remove('visible');
    /* Store the capture to move */
    window._moveToHabitCapture=c;
    showHabitPicker();
    document.getElementById('habit-picker-overlay').classList.add('visible');
    pushNav('habit-picker-overlay');
    return;
}
saveCaptures();document.getElementById('edit-modal').classList.remove('visible');openDetail(currentDetailId);});

/* ---- Thoughts Screen Speak Button ---- */
const thoughtsSpeakBtn=document.getElementById('thoughts-speak-btn');
const thoughtsLpRing=document.getElementById('thoughts-lp-ring');
const thoughtsTimerEl=document.getElementById('thoughts-speak-timer');
let thoughtsLpTimer=null,thoughtsIsLP=false,thoughtsIsWrite=false,thoughtsIsRec=false;
let thoughtsRec=null,thoughtsFT='',thoughtsIT='';
let thoughtsRecStart=0,thoughtsRecInterval=null;
function thoughtsUpdateTimer(){var elapsed=Math.floor((Date.now()-thoughtsRecStart)/1000);var m=Math.floor(elapsed/60),s=elapsed%60;thoughtsTimerEl.textContent=m+':'+String(s).padStart(2,'0');}
function thoughtsStartTimer(){thoughtsRecStart=Date.now();thoughtsUpdateTimer();thoughtsTimerEl.classList.add('visible');thoughtsRecInterval=setInterval(thoughtsUpdateTimer,250);}
function thoughtsStopTimer(){clearInterval(thoughtsRecInterval);thoughtsRecInterval=null;thoughtsTimerEl.classList.remove('visible');}

function thoughtsPopFeedback(){
    thoughtsSpeakBtn.style.transform='scale(1.3)';
    thoughtsSpeakBtn.style.boxShadow='0 0 32px rgba(196,180,138,.7),0 0 12px rgba(196,180,138,.4),0 4px 16px rgba(0,0,0,.4)';
    setTimeout(()=>{thoughtsSpeakBtn.style.transform='';thoughtsSpeakBtn.style.boxShadow='';},300);
}
function thoughtsEnterWrite(){
    thoughtsIsWrite=true;thoughtsIsLP=true;
    try{navigator.vibrate(200);}catch(e){}
    thoughtsPopFeedback();
    thoughtsSpeakBtn.classList.add('write-mode');
    thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Write';
    thoughtsSpeakBtn.querySelector('svg').innerHTML='<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    thoughtsLpRing.classList.remove('active');
}
function thoughtsExitWrite(){
    thoughtsIsWrite=false;
    thoughtsSpeakBtn.classList.remove('write-mode');
    thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Speak';
    thoughtsSpeakBtn.querySelector('svg').innerHTML='<path d="M12 21l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.2L12 21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/><path d="M4 9c1.5-.5 3 .5 3.5 1.5s0 2.5-1 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 7c1-.5 2.5 0 3 1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 13c-1 .5-1.5 2-.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
}
function thoughtsOpenWrite(){
    currentMode='thought';window._habitDirectSave=false;
    document.getElementById('write-textarea').value='';
    var _wt=document.querySelector('#write-overlay .modal-title');if(_wt)_wt.textContent='What\u2019s on your mind?';
    const wo=document.getElementById('write-overlay');wo.classList.remove('habit-write-mode');
    document.getElementById('write-refine-preview').style.display='none';document.getElementById('write-refine-status').style.display='none';document.getElementById('write-refine-actions').style.display='none';
    if(typeof syncWriteLangToggle==='function')syncWriteLangToggle();
    wo.classList.add('visible');pushNav('write-overlay');
    setTimeout(()=>document.getElementById('write-textarea').focus(),100);
}
function thoughtsSaveVoice(text){
    if(text){currentCapture.text=cleanupTranscript(text);currentCapture.inputType='voice';currentCapture.lang=currentLang;currentMode='thought';showPostRecordFlow();}
}
function createThoughtsRec(){
    var SRApi=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SRApi)return null;
    var r=new SRApi();r.continuous=!isMobile;r.interimResults=true;r.lang=currentLang;
    r.onstart=function(){thoughtsIsRec=true;thoughtsSpeakBtn.classList.add('recording');thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Stop';thoughtsStartTimer();};
    r.onresult=function(e){thoughtsIT='';for(var i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)thoughtsFT+=e.results[i][0].transcript+' ';else thoughtsIT+=e.results[i][0].transcript;}};
    r.onerror=function(e){if(e.error==='no-speech'){if(thoughtsIsRec){setTimeout(function(){try{thoughtsRec.start();}catch(ex){}},100);}return;}
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){thoughtsIsRec=false;thoughtsSpeakBtn.classList.remove('recording');thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Speak';thoughtsStopTimer();thoughtsOpenWrite();return;}};
    r.onend=function(){if(thoughtsIsRec){setTimeout(function(){try{thoughtsRec.start();}catch(ex){thoughtsIsRec=false;thoughtsSpeakBtn.classList.remove('recording');thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Speak';thoughtsStopTimer();var t=(thoughtsFT+thoughtsIT).trim();thoughtsFT='';thoughtsIT='';if(t){thoughtsSaveVoice(t);}else{showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}}},100);return;}
    thoughtsSpeakBtn.classList.remove('recording');thoughtsSpeakBtn.querySelector('.speak-btn-label').textContent='Speak';thoughtsStopTimer();
    var t=(thoughtsFT+thoughtsIT).trim();thoughtsFT='';thoughtsIT='';
    if(t){thoughtsSaveVoice(t);}else{showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}};
    return r;
}
function thoughtsStartRec(){thoughtsFT='';thoughtsIT='';
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){stream.getTracks().forEach(function(t){t.stop();});thoughtsRec=createThoughtsRec();if(!thoughtsRec){thoughtsOpenWrite();return;}thoughtsRec.lang=currentLang;thoughtsRec.start();}).catch(function(){thoughtsOpenWrite();});
}
thoughtsSpeakBtn.addEventListener('touchstart',e=>{if(thoughtsIsRec)return;thoughtsIsLP=false;thoughtsLpRing.classList.add('active');try{navigator.vibrate([1,750,300]);}catch(ex){}thoughtsLpTimer=setTimeout(()=>{thoughtsEnterWrite();},800);},{passive:true});
thoughtsSpeakBtn.addEventListener('touchend',e=>{clearTimeout(thoughtsLpTimer);thoughtsLpRing.classList.remove('active');window._thoughtsTouchHandled=true;if(thoughtsIsLP&&thoughtsIsWrite){thoughtsIsLP=false;thoughtsOpenWrite();thoughtsExitWrite();return;}try{navigator.vibrate(0);}catch(ex){}thoughtsIsLP=false;if(thoughtsIsWrite){thoughtsOpenWrite();thoughtsExitWrite();return;}if(thoughtsIsRec){thoughtsIsRec=false;try{thoughtsRec.stop();}catch(ex){}}else if(SR){thoughtsStartRec();}else{thoughtsOpenWrite();}},{passive:true});
thoughtsSpeakBtn.addEventListener('touchmove',()=>{clearTimeout(thoughtsLpTimer);thoughtsLpRing.classList.remove('active');thoughtsIsLP=false;try{navigator.vibrate(0);}catch(ex){}},{passive:true});
thoughtsSpeakBtn.addEventListener('mousedown',e=>{if(thoughtsIsRec||e.button!==0)return;thoughtsIsLP=false;thoughtsLpRing.classList.add('active');thoughtsLpTimer=setTimeout(()=>{thoughtsEnterWrite();},800);});
thoughtsSpeakBtn.addEventListener('mouseup',e=>{clearTimeout(thoughtsLpTimer);thoughtsLpRing.classList.remove('active');if(thoughtsIsLP&&thoughtsIsWrite){thoughtsIsLP=false;thoughtsOpenWrite();thoughtsExitWrite();return;}thoughtsIsLP=false;});
thoughtsSpeakBtn.addEventListener('click',e=>{
    if(window._thoughtsTouchHandled){window._thoughtsTouchHandled=false;return;}
    if(thoughtsIsWrite){thoughtsOpenWrite();thoughtsExitWrite();return;}
    if(thoughtsIsRec){thoughtsIsRec=false;try{thoughtsRec.stop();}catch(ex){}return;}
    if(SR){thoughtsStartRec();}else{thoughtsOpenWrite();}
});

let _isRefining=false;
document.getElementById('detail-refine').addEventListener('click',async()=>{if(_isRefining)return;_isRefining=true;const c=captures.find(x=>x.id===currentDetailId);if(!c){_isRefining=false;return;}const ov=document.getElementById('refine-overlay'),bd=document.getElementById('refine-body'),ac=document.getElementById('refine-actions');bd.innerHTML='<div class="refine-label">Original</div><div class="refine-original">'+escapeHtml(c.text)+'</div><div class="refine-label">Refined</div><div class="refine-loading"><div class="refine-loading-spinner"></div>Refining your text...</div>';ac.style.display='none';ov.classList.add('visible');pushNav('refine-overlay');const result=await refineText(c.text,c.lang||'en-US');_isRefining=false;let statusHtml='';if(typeof result==='object'){if(result.source==='local'&&result.error){statusHtml='<div style="font-size:12px;color:var(--mood-1);margin-bottom:12px;">Gemini unavailable: '+escapeHtml(result.error)+'. Showing local cleanup.</div>';}else if(result.source==='local'){statusHtml='<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">No API key. Showing local cleanup.</div>';}else{statusHtml='<div style="font-size:12px;color:var(--accent-moss);margin-bottom:12px;">Refined with Gemini AI</div>';}}const refinedText=typeof result==='object'?result.text:result;bd.innerHTML='<div class="refine-label">Original</div><div class="refine-original">'+escapeHtml(c.text)+'</div><div class="refine-label">Refined</div>'+statusHtml+'<div class="refine-refined" id="refined-text">'+escapeHtml(refinedText)+'</div>';ac.style.display='flex';});
document.getElementById('refine-dismiss').addEventListener('click',()=>document.getElementById('refine-overlay').classList.remove('visible'));
document.getElementById('refine-reject').addEventListener('click',()=>document.getElementById('refine-overlay').classList.remove('visible'));
document.getElementById('refine-accept').addEventListener('click',()=>{
if(window._heRefineTarget){
    window._heRefineTarget=false;
    var hab=habits.find(function(h){return h.id===currentHabitId;});
    if(hab){var entry=(hab.entries||[]).find(function(e){return e.id===currentHabitEntryId;});
    var el=document.getElementById('refined-text');if(entry&&el){entry.text=el.textContent;saveHabits();}}
    document.getElementById('refine-overlay').classList.remove('visible');
    var updEntry=hab?(hab.entries||[]).find(function(e){return e.id===currentHabitEntryId;}):null;
    if(updEntry)openHabitEntryDetail(updEntry);return;
}
const c=captures.find(x=>x.id===currentDetailId);if(!c)return;const rEl=document.getElementById('refined-text');if(rEl){c.text=rEl.textContent;saveCaptures();}document.getElementById('refine-overlay').classList.remove('visible');openDetail(currentDetailId);});

function updateSettingsUI(){document.getElementById('total-captures').textContent=captures.length;document.getElementById('last-backup').textContent=settings.lastBackup?'Last: '+new Date(settings.lastBackup).toLocaleDateString():'Never backed up';document.querySelectorAll('#settings-lang-toggle .settings-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===settings.defaultLang));document.getElementById('api-key-status').textContent=settings.geminiApiKey?'Configured \u2713':'Not configured';}
document.getElementById('export-btn').addEventListener('click',e=>{e.stopPropagation();const d={exportDate:new Date().toISOString(),version:'1.5.0',captures,habits,settings:{defaultLang:settings.defaultLang,lastBackup:settings.lastBackup}};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='speak-backup-'+new Date().toISOString().split('T')[0]+'.json';a.click();URL.revokeObjectURL(u);settings.lastBackup=new Date().toISOString();saveSettings();updateSettingsUI();});
document.getElementById('api-key-btn').addEventListener('click',e=>{e.stopPropagation();const key=prompt('Enter your Gemini API key from Google AI Studio:\n(Leave empty to clear)',settings.geminiApiKey||'');if(key!==null){settings.geminiApiKey=key.trim();saveSettings();updateSettingsUI();}});
document.querySelectorAll('#settings-lang-toggle .settings-lang-btn').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();settings.defaultLang=btn.dataset.lang;currentLang=settings.defaultLang;langBtns.forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));saveSettings();updateSettingsUI();});});
(function(){if(!settings.lastBackup)return;const ds=Math.floor((new Date()-new Date(settings.lastBackup))/864e5);if(ds>=14&&captures.length>0){const tab=document.querySelector('[data-screen="settings-screen"]');if(tab&&!tab.querySelector('.reminder-dot')){const d=document.createElement('span');d.className='reminder-dot';d.style.cssText='width:6px;height:6px;background:var(--accent-warm);border-radius:50%;position:absolute;top:6px;right:12px;';tab.style.position='relative';tab.appendChild(d);}}})();
updateSettingsUI();
