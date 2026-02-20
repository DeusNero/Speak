function saveCapture(){
const entry={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),text:currentCapture.text,mood:currentCapture.mood,tags:currentCapture.tags,lang:currentCapture.lang||currentLang,inputType:currentCapture.inputType||'voice',createdAt:new Date().toISOString()};
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
if(me)h+='<div class="capture-card-mood" style="font-size:18px;">'+me+'</div>';
h+='</div></div>';
});list.innerHTML=h;
list.querySelectorAll('.capture-card').forEach(card=>{
    let lpTimer=null;
    card.addEventListener('touchstart',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!thoughtsSelectMode)enterThoughtsSelection(card.dataset.id);},{passive:true},500);},{passive:true});
    card.addEventListener('touchend',()=>clearTimeout(lpTimer),{passive:true});
    card.addEventListener('touchmove',()=>clearTimeout(lpTimer),{passive:true});
    card.addEventListener('mousedown',()=>{lpTimer=setTimeout(()=>{lpTimer=null;if(!thoughtsSelectMode)enterThoughtsSelection(card.dataset.id);},500);});
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
function openDetail(id){const c=captures.find(x=>x.id===id);if(!c)return;currentDetailId=id;document.getElementById('detail-date').innerHTML=formatDate(new Date(c.createdAt))+' '+(c.inputType==='text'?'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>':'<svg style="display:inline;vertical-align:middle;width:12px;height:12px;margin-left:6px" viewBox="0 0 24 24" fill="none" stroke="#c4b48a" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>');document.getElementById('detail-mood').textContent=c.mood?MOODS[c.mood]:'';document.getElementById('detail-text').textContent=c.text;const tc=document.getElementById('detail-tags');tc.innerHTML=(c.tags&&c.tags.length>0)?c.tags.map(t=>'<span class="tag-pill '+t+'">'+({emotion:'Feel',poem:'Poetry',habit:'Habit'}[t]||t.charAt(0).toUpperCase()+t.slice(1))+'</span>').join(''):'<span class="tag-pill untagged">⌛</span>';screens.forEach(s=>s.classList.remove('active'));document.getElementById('detail-screen').classList.add('active');pushNav('detail-screen');}
document.getElementById('detail-back').addEventListener('click',()=>showScreen('thoughts-screen'));
document.getElementById('detail-delete').addEventListener('click',()=>{document.getElementById('confirm-overlay').classList.add('visible');pushNav('confirm-overlay');});
document.getElementById('confirm-cancel').addEventListener('click',()=>document.getElementById('confirm-overlay').classList.remove('visible'));
document.getElementById('confirm-close-x').addEventListener('click',()=>document.getElementById('confirm-overlay').classList.remove('visible'));
document.getElementById('confirm-action').addEventListener('click',()=>{captures=captures.filter(c=>c.id!==currentDetailId);saveCaptures();document.getElementById('confirm-overlay').classList.remove('visible');showScreen('thoughts-screen');});
document.getElementById('detail-edit').addEventListener('click',()=>{const c=captures.find(x=>x.id===currentDetailId);if(!c)return;document.getElementById('edit-text-input').value=c.text;document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.mood)===(c.mood||0)));document.querySelectorAll('#edit-tag-row .edit-tag-btn').forEach(b=>b.classList.toggle('selected',c.tags&&c.tags.includes(b.dataset.tag)));document.getElementById('edit-modal').classList.add('visible');pushNav('edit-modal');});
document.getElementById('edit-cancel').addEventListener('click',()=>document.getElementById('edit-modal').classList.remove('visible'));
document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('#edit-mood-row .edit-mood-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');});});
document.querySelectorAll('#edit-tag-row .edit-tag-btn').forEach(btn=>{btn.addEventListener('click',()=>btn.classList.toggle('selected'));});
document.getElementById('edit-save').addEventListener('click',()=>{const c=captures.find(x=>x.id===currentDetailId);if(!c)return;c.text=document.getElementById('edit-text-input').value;const sm=document.querySelector('#edit-mood-row .edit-mood-btn.selected');c.mood=sm?(parseInt(sm.dataset.mood)||null):null;const st=[];document.querySelectorAll('#edit-tag-row .edit-tag-btn.selected').forEach(b=>st.push(b.dataset.tag));c.tags=st;
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

let _isRefining=false;
document.getElementById('detail-refine').addEventListener('click',async()=>{if(_isRefining)return;_isRefining=true;const c=captures.find(x=>x.id===currentDetailId);if(!c){_isRefining=false;return;}const ov=document.getElementById('refine-overlay'),bd=document.getElementById('refine-body'),ac=document.getElementById('refine-actions');bd.innerHTML='<div class="refine-label">Original</div><div class="refine-original">'+escapeHtml(c.text)+'</div><div class="refine-label">Refined</div><div class="refine-loading"><div class="refine-loading-spinner"></div>Refining your text...</div>';ac.style.display='none';ov.classList.add('visible');pushNav('refine-overlay');const result=await refineText(c.text,c.lang||'en-US');_isRefining=false;let statusHtml='';if(typeof result==='object'){if(result.source==='local'&&result.error){statusHtml='<div style="font-size:12px;color:var(--mood-1);margin-bottom:12px;">Gemini unavailable: '+escapeHtml(result.error)+'. Showing local cleanup.</div>';}else if(result.source==='local'){statusHtml='<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">No API key. Showing local cleanup.</div>';}else{statusHtml='<div style="font-size:12px;color:var(--accent-moss);margin-bottom:12px;">Refined with Gemini AI</div>';}}const refinedText=typeof result==='object'?result.text:result;bd.innerHTML='<div class="refine-label">Original</div><div class="refine-original">'+escapeHtml(c.text)+'</div><div class="refine-label">Refined</div>'+statusHtml+'<div class="refine-refined" id="refined-text">'+escapeHtml(refinedText)+'</div>';ac.style.display='flex';});
document.getElementById('refine-dismiss').addEventListener('click',()=>document.getElementById('refine-overlay').classList.remove('visible'));
document.getElementById('refine-reject').addEventListener('click',()=>document.getElementById('refine-overlay').classList.remove('visible'));
document.getElementById('refine-accept').addEventListener('click',()=>{const c=captures.find(x=>x.id===currentDetailId);if(!c)return;const el=document.getElementById('refined-text');if(el){c.text=el.textContent;saveCaptures();}document.getElementById('refine-overlay').classList.remove('visible');openDetail(currentDetailId);});

function updateSettingsUI(){document.getElementById('total-captures').textContent=captures.length;document.getElementById('last-backup').textContent=settings.lastBackup?'Last: '+new Date(settings.lastBackup).toLocaleDateString():'Never backed up';document.querySelectorAll('#settings-lang-toggle .settings-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===settings.defaultLang));document.getElementById('api-key-status').textContent=settings.geminiApiKey?'Configured \u2713':'Not configured';}
document.getElementById('export-btn').addEventListener('click',e=>{e.stopPropagation();const d={exportDate:new Date().toISOString(),version:'1.5.0',captures,habits,settings:{defaultLang:settings.defaultLang,lastBackup:settings.lastBackup}};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='speak-backup-'+new Date().toISOString().split('T')[0]+'.json';a.click();URL.revokeObjectURL(u);settings.lastBackup=new Date().toISOString();saveSettings();updateSettingsUI();});
document.getElementById('api-key-btn').addEventListener('click',e=>{e.stopPropagation();const key=prompt('Enter your Gemini API key from Google AI Studio:\n(Leave empty to clear)',settings.geminiApiKey||'');if(key!==null){settings.geminiApiKey=key.trim();saveSettings();updateSettingsUI();}});
document.querySelectorAll('#settings-lang-toggle .settings-lang-btn').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();settings.defaultLang=btn.dataset.lang;currentLang=settings.defaultLang;langBtns.forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));saveSettings();updateSettingsUI();});});
(function(){if(!settings.lastBackup)return;const ds=Math.floor((new Date()-new Date(settings.lastBackup))/864e5);if(ds>=14&&captures.length>0){const tab=document.querySelector('[data-screen="settings-screen"]');if(tab&&!tab.querySelector('.reminder-dot')){const d=document.createElement('span');d.className='reminder-dot';d.style.cssText='width:6px;height:6px;background:var(--accent-warm);border-radius:50%;position:absolute;top:6px;right:12px;';tab.style.position='relative';tab.appendChild(d);}}})();
updateSettingsUI();
