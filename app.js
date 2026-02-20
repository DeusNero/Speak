let navHistory=[];
function pushNav(screenId){navHistory.push(screenId);history.pushState({screen:screenId},'');}
const MOODS={1:'\u{1f622}',2:'\u{1f615}',3:'\u{1f610}',4:'\u{1f642}',5:'\u{1f60a}'};
let currentCapture={text:'',mood:null,tags:[],inputType:'voice'},currentDetailId=null,currentFilter='all',currentMoodFilter=0,currentDateFilter=null,currentView='feed',searchQuery='';
let isRecording=false,recognition=null,recordingTimer=null,recordingSeconds=0;
const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function formatDate(d){const t=new Date(),y=new Date(t);y.setDate(y.getDate()-1);let s;if(d.toDateString()===t.toDateString())s='Today';else if(d.toDateString()===y.toDateString())s='Yesterday';else s=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});return s+' \u00b7 '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});}

const screens=document.querySelectorAll('.screen'),tabItems=document.querySelectorAll('.tab-item');

function showToast(text){
    const existing=document.querySelector('.toast-msg');if(existing)existing.remove();
    const toast=document.createElement('div');
    toast.className='toast-msg';
    toast.style.cssText='position:fixed;bottom:90px;left:16px;right:16px;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:12px 16px;z-index:200;font-size:13px;color:var(--text-secondary);line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.3);overflow:hidden;animation:toastIn .3s ease;';
    toast.textContent=text;
    const bar=document.createElement('div');
    bar.style.cssText='position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,#c4b48a,#a89870);width:100%;animation:toastBar 3s linear forwards;border-radius:0 0 var(--radius-md) var(--radius-md);';
    toast.appendChild(bar);
    document.body.appendChild(toast);
    setTimeout(()=>{toast.style.animation='toastOut .3s ease forwards';setTimeout(()=>toast.remove(),300);},3000);
}
function showScreen(id){
    /* Exit any active selection mode when navigating away */
    if(typeof thoughtsSelectMode!=='undefined'&&thoughtsSelectMode)exitThoughtsSelection();
    if(typeof habitsSelectMode!=='undefined'&&habitsSelectMode)exitHabitsSelection();
    if(typeof habitEntriesSelectMode!=='undefined'&&habitEntriesSelectMode)exitHabitEntriesSelection();
    screens.forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');pushNav(id);tabItems.forEach(t=>t.classList.toggle('active',t.dataset.screen===id));if(id==='thoughts-screen')renderCaptures();if(id==='habits-screen'){_overdueBannerDismissed=false;renderHabits();}if(id==='settings-screen')updateSettingsUI();
}
tabItems.forEach(tab=>{tab.addEventListener('click',()=>{if(!tab.classList.contains('disabled'))showScreen(tab.dataset.screen);});});

(function(){const h=new Date().getHours(),el=document.getElementById('greeting-text');if(h<6)el.textContent='Late night reflection';else if(h<12)el.textContent='Morning reflection';else if(h<17)el.textContent='Afternoon reflection';else if(h<21)el.textContent='Reflect and relax';else el.textContent='Calm reflection';})();

const langBtns=document.querySelectorAll('.speak-screen .lang-btn');let currentLang=settings.defaultLang;
langBtns.forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));
langBtns.forEach(btn=>{btn.addEventListener('click',()=>{langBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentLang=btn.dataset.lang;if(isRecording&&recognition){recognition.lang=currentLang;recognition.stop();setTimeout(()=>recognition.start(),200);}});});

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const speakBtn=document.getElementById('speak-btn'),timerEl=document.getElementById('speak-timer');
if(!SR){speakBtn.addEventListener('click',()=>{const t=prompt('Speech recognition not available.\nType your thought:');if(t&&t.trim()){currentCapture.text=cleanupTranscript(t.trim());showPostRecordFlow();}});}
else{
let fT='',iT='',restartTimeout=null;
function createRecognition(){
const r=new SR();r.continuous=!isMobile;r.interimResults=true;r.lang=currentLang;
r.onstart=()=>{isRecording=true;speakBtn.classList.add('recording');speakBtn.querySelector('.speak-btn-label').textContent='Stop';timerEl.classList.add('visible');if(!recordingTimer){recordingSeconds=0;updateTimer();recordingTimer=setInterval(()=>{recordingSeconds++;updateTimer();},1000);}};
r.onresult=e=>{iT='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)fT+=e.results[i][0].transcript+' ';else iT+=e.results[i][0].transcript;}};
r.onerror=e=>{console.warn('Speech error:',e.error);if(e.error==='no-speech'){if(isRecording){restartTimeout=setTimeout(()=>{try{recognition.start();}catch(ex){}},100);}return;}if(e.error==='not-allowed'||e.error==='service-not-allowed'){isRecording=false;clearInterval(recordingTimer);recordingTimer=null;speakBtn.classList.remove('recording');speakBtn.querySelector('.speak-btn-label').textContent=(currentMode==='habit'?'Habit':'Speak');timerEl.classList.remove('visible');const t=prompt('Microphone access denied or speech not available.\nYou can type your thought instead:');if(t&&t.trim()){currentCapture.text=cleanupTranscript(t.trim());currentCapture.inputType='text';showPostRecordFlow();}return;}if(e.error==='aborted')return;isRecording=false;clearInterval(recordingTimer);recordingTimer=null;speakBtn.classList.remove('recording');speakBtn.querySelector('.speak-btn-label').textContent=(currentMode==='habit'?'Habit':'Speak');timerEl.classList.remove('visible');};
r.onend=()=>{if(isRecording){restartTimeout=setTimeout(()=>{try{recognition.start();}catch(ex){isRecording=false;clearInterval(recordingTimer);recordingTimer=null;speakBtn.classList.remove('recording');speakBtn.querySelector('.speak-btn-label').textContent=(currentMode==='habit'?'Habit':'Speak');timerEl.classList.remove('visible');const t=(fT+iT).trim();fT='';iT='';if(t){currentCapture.text=cleanupTranscript(t);
if(currentMode==='habit'){currentCapture.tags=['habit'];showHabitPicker();document.getElementById('habit-picker-overlay').classList.add('visible');pushNav('habit-picker-overlay');}
else{showPostRecordFlow();}}else{
showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}}},100);return;}clearInterval(recordingTimer);recordingTimer=null;speakBtn.classList.remove('recording');speakBtn.querySelector('.speak-btn-label').textContent=(currentMode==='habit'?'Habit':'Speak');timerEl.classList.remove('visible');const t=(fT+iT).trim();fT='';iT='';if(t){currentCapture.text=cleanupTranscript(t);
if(currentMode==='habit'){currentCapture.tags=['habit'];showHabitPicker();document.getElementById('habit-picker-overlay').classList.add('visible');pushNav('habit-picker-overlay');}
else{showPostRecordFlow();}}else{
showToast("Couldn\u2019t hear anything. Please try again or speak a bit louder.");}};
return r;}
recognition=createRecognition();
async function startRecording(){fT='';iT='';currentCapture.inputType='voice';if(restartTimeout){clearTimeout(restartTimeout);restartTimeout=null;}
try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());recognition=createRecognition();recognition.lang=currentLang;recognition.start();}
catch(e){console.warn('Mic permission error:',e);const t=prompt('Could not access microphone.\nYou can type your thought instead:');if(t&&t.trim()){currentCapture.text=cleanupTranscript(t.trim());currentCapture.inputType='text';showPostRecordFlow();}}}

/* Long-press to write mode */
let longPressTimer=null,isLongPress=false,isWriteMode=false;
const lpRing=document.getElementById('long-press-ring');
function enterWriteMode(){
    isWriteMode=true;isLongPress=true;
    try{navigator.vibrate(200);}catch(e){}
    speakBtn.classList.add('write-mode');
    speakBtn.querySelector('.speak-btn-label').textContent='Write';
    speakBtn.querySelector('svg').innerHTML='<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    lpRing.classList.remove('active');
}
function exitWriteMode(){
    isWriteMode=false;
    speakBtn.classList.remove('write-mode');
    updateSpeakButtonForMode();
}
function openWriteModal(){
    var _wt=document.querySelector('#write-overlay .modal-title');
    if(_wt){if(currentMode==='habit'||window._habitDirectSave){_wt.innerHTML='Talk about your habits <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-left:4px;"><path d="M12 22V12"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5"/></svg>';}else{_wt.textContent='What\u2019s on your mind?';}}
    const writeTitle=document.querySelector('#write-overlay .modal-title');
    
    document.getElementById('write-textarea').value='';syncWriteLangToggle();
    const wo=document.getElementById('write-overlay');wo.classList.toggle('habit-write-mode',currentMode==='habit');
    document.getElementById('write-refine-preview').style.display='none';document.getElementById('write-refine-status').style.display='none';document.getElementById('write-refine-actions').style.display='none';
    document.getElementById('write-overlay').classList.add('visible');pushNav('write-overlay');
    setTimeout(()=>document.getElementById('write-textarea').focus(),100);
}

/* Write modal lang toggle */
function syncWriteLangToggle(){document.querySelectorAll('.write-lang-btn').forEach(b=>{b.classList.toggle('active',b.dataset.lang===currentLang);});}
document.querySelectorAll('.write-lang-btn').forEach(btn=>{btn.addEventListener('click',()=>{currentLang=btn.dataset.lang;document.querySelectorAll('.write-lang-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');/* Also sync main lang toggle */document.querySelectorAll('.lang-btn:not(.write-lang-btn)').forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));document.querySelectorAll('.settings-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));localStorage.setItem('speak_lang',currentLang);});});
document.getElementById('write-close-x').addEventListener('click',()=>{document.getElementById('write-overlay').classList.remove('visible');exitWriteMode();});
document.getElementById('write-cancel').addEventListener('click',()=>{document.getElementById('write-overlay').classList.remove('visible');exitWriteMode();});
document.getElementById('write-save').addEventListener('click',()=>{
    const t=document.getElementById('write-textarea').value.trim();
    const refined=window._writeRefined;
const previewVisible=document.getElementById('write-refine-preview').style.display!=='none';
if(previewVisible&&refined)t=refined;
/* Clear refine state */
window._writeRefined=null;window._writeRefineOriginal=null;
document.getElementById('write-refine-preview').style.display='none';
document.getElementById('write-refine-status').style.display='none';
document.getElementById('write-refine-actions').style.display='none';
if(t){
if(window._habitDirectSave){
    window._habitDirectSave=false;
    const hab=habits.find(h=>h.id===currentHabitId);
    if(hab){
        hab.entries.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),text:t,inputType:'text',lang:currentLang,createdAt:new Date().toISOString()});
        saveHabits();
    }
    document.getElementById('write-overlay').classList.remove('visible');
    if(typeof exitWriteMode==='function')exitWriteMode();
    openHabitDetail(currentHabitId);
}else{
    currentCapture.text=t;currentCapture.inputType='text';currentCapture.lang=currentLang;
    document.getElementById('write-overlay').classList.remove('visible');exitWriteMode();
    if(currentMode==='habit'){currentCapture.tags=['habit'];showHabitPicker();document.getElementById('habit-picker-overlay').classList.add('visible');pushNav('habit-picker-overlay');}
    else{showPostRecordFlow();}
}}
});
document.getElementById('write-refine-btn').addEventListener('click',async()=>{
    const ta=document.getElementById('write-textarea');
    const raw=ta.value.trim();
    if(!raw)return;
    const btn=document.getElementById('write-refine-btn');
    const origHtml=btn.innerHTML;
    const preview=document.getElementById('write-refine-preview');
    const status=document.getElementById('write-refine-status');
    const actions=document.getElementById('write-refine-actions');
    btn.innerHTML='<div style="width:16px;height:16px;border:2px solid var(--border-subtle);border-top-color:#c4b48a;border-radius:50%;animation:spin .8s linear infinite;"></div>';
    btn.style.pointerEvents='none';
    preview.style.display='none';status.style.display='none';actions.style.display='none';
    const result=await refineText(raw,currentLang);
    const refined=typeof result==='object'?result.text:result;
    btn.innerHTML=origHtml;btn.style.pointerEvents='auto';
    /* Show preview */
    preview.textContent=refined;preview.style.display='block';
    /* Show status */
    status.style.display='block';
    if(typeof result==='object'&&result.source==='gemini'){
        status.style.color='var(--accent-moss)';status.textContent='Refined with Gemini AI';
    }else if(typeof result==='object'&&result.error){
        status.style.color='var(--mood-1)';status.textContent='Gemini unavailable: '+result.error;
    }else{
        status.style.color='var(--text-muted)';status.textContent='Local cleanup applied';
    }
    /* Show accept/dismiss */
    actions.style.display='flex';
    window._writeRefineOriginal=raw;
    window._writeRefined=refined;
});
document.getElementById('write-refine-accept').addEventListener('click',()=>{
    document.getElementById('write-textarea').value=window._writeRefined||'';
    document.getElementById('write-refine-preview').style.display='none';
    document.getElementById('write-refine-status').style.display='none';
    document.getElementById('write-refine-actions').style.display='none';
});
document.getElementById('write-refine-dismiss').addEventListener('click',()=>{
    document.getElementById('write-refine-preview').style.display='none';
    document.getElementById('write-refine-status').style.display='none';
    document.getElementById('write-refine-actions').style.display='none';
});


speakBtn.addEventListener('touchstart',e=>{
    const now=Date.now();
    
    /* Double-tap: if second tap within 300ms */
    if(now-lastTapTime<300&&now-lastTapTime>50){
        /* Cancel any pending single-tap action */
        clearTimeout(window._singleTapTimer);
        window._singleTapTimer=null;
        clearTimeout(longPressTimer);
        currentMode=currentMode==='thought'?'habit':'thought';
        document.querySelectorAll('.mode-toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));
        updateSpeakButtonForMode();
        try{if(navigator.vibrate)navigator.vibrate([30,50,30]);}catch(ex){}
        lastTapTime=0;
        doubleTapCooldown=true;
        setTimeout(()=>{doubleTapCooldown=false;},500);
        return;
    }
    lastTapTime=now;
    /* Long-press detection */
    if(isRecording)return;
    isLongPress=false;
    lpRing.classList.add('active');
    try{navigator.vibrate([1,750,300]);}catch(ex){}
    longPressTimer=setTimeout(()=>{enterWriteMode();},800);
},{passive:true});
speakBtn.addEventListener('touchend',e=>{
    clearTimeout(longPressTimer);lpRing.classList.remove('active');
    window._touchHandled=true;
    if(isLongPress&&isWriteMode){isLongPress=false;openWriteModal();exitWriteMode();return;}
    try{navigator.vibrate(0);}catch(ex){}
    isLongPress=false;
    if(isWriteMode){openWriteModal();exitWriteMode();return;}
    if(doubleTapCooldown)return;
    /* Delay action to allow double-tap detection */
    if(isRecording){
        /* Stop immediately - no need to wait */
        isRecording=false;if(restartTimeout){clearTimeout(restartTimeout);restartTimeout=null;}try{recognition.stop();}catch(ex){}
    }else{
        /* Delay start by 300ms to see if double-tap comes */
        
        window._singleTapTimer=setTimeout(()=>{
            window._singleTapTimer=null;
            if(!doubleTapCooldown&&!isRecording){startRecording();}
        },300);
    }
},{passive:true});
speakBtn.addEventListener('touchmove',()=>{clearTimeout(longPressTimer);lpRing.classList.remove('active');isLongPress=false;try{navigator.vibrate(0);}catch(ex){}},{passive:true});
/* Desktop mouse long-press */
speakBtn.addEventListener('mousedown',e=>{if(isRecording||doubleTapCooldown||e.button!==0)return;isLongPress=false;lpRing.classList.add('active');longPressTimer=setTimeout(()=>{enterWriteMode();},800);});
speakBtn.addEventListener('mouseup',e=>{clearTimeout(longPressTimer);lpRing.classList.remove('active');if(isLongPress&&isWriteMode){isLongPress=false;openWriteModal();return;}isLongPress=false;});
speakBtn.addEventListener('mouseleave',()=>{clearTimeout(longPressTimer);lpRing.classList.remove('active');isLongPress=false;});
speakBtn.addEventListener('click',e=>{
    if(doubleTapCooldown||window._touchHandled){window._touchHandled=false;return;}
    if(isWriteMode){openWriteModal();exitWriteMode();return;}
    if(isRecording){isRecording=false;if(restartTimeout){clearTimeout(restartTimeout);restartTimeout=null;}try{recognition.stop();}catch(ex){}}
    else{startRecording();}
});}
function updateTimer(){const m=Math.floor(recordingSeconds/60),s=recordingSeconds%60;timerEl.textContent=m+':'+String(s).padStart(2,'0');}

function showPostRecordFlow(){currentCapture.mood=null;currentCapture.tags=[];showScreen('post-record-screen');document.getElementById('mood-step').classList.add('active');document.getElementById('tag-step').classList.remove('active');document.querySelectorAll('#mood-step .mood-btn').forEach(b=>b.classList.remove('selected'));document.querySelectorAll('#tag-step .tag-btn').forEach(b=>b.classList.remove('selected'));}
document.querySelectorAll('#mood-step .mood-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('#mood-step .mood-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');currentCapture.mood=parseInt(btn.dataset.mood);});});
document.getElementById('mood-next').addEventListener('click',()=>{document.getElementById('mood-step').classList.remove('active');document.getElementById('tag-step').classList.add('active');});
document.getElementById('mood-skip').addEventListener('click',()=>{currentCapture.mood=null;document.getElementById('mood-step').classList.remove('active');document.getElementById('tag-step').classList.add('active');});
document.querySelectorAll('#tag-step .tag-btn').forEach(btn=>{btn.addEventListener('click',()=>btn.classList.toggle('selected'));});
document.getElementById('tag-save').addEventListener('click',()=>{const tags=[];document.querySelectorAll('#tag-step .tag-btn.selected').forEach(b=>tags.push(b.dataset.tag));currentCapture.tags=tags;
if(tags.includes('habit')&&habits.length>0){showHabitPicker();document.getElementById('habit-picker-overlay').classList.add('visible');pushNav('habit-picker-overlay');}
else{saveCapture();}});
document.getElementById('tag-skip').addEventListener('click',()=>{currentCapture.tags=[];saveCapture();});

if('serviceWorker' in navigator){
navigator.serviceWorker.register('./sw.js').then(reg=>{
reg.update();
console.log('SW registered, scope:',reg.scope);
}).catch(e=>console.warn('SW registration failed:',e));
navigator.serviceWorker.addEventListener('controllerchange',()=>{console.log('SW updated, reloading');window.location.reload();});
}


/* Mode toggle: Thought vs Habit */
let currentMode='thought',lastTapTime=0,doubleTapCooldown=false;
document.querySelectorAll('.mode-toggle-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
        currentMode=btn.dataset.mode;
        document.querySelectorAll('.mode-toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));
        updateSpeakButtonForMode();
    });
});

function updateSpeakButtonForMode(){
    const container=document.querySelector('.speak-btn-container');
    container.classList.toggle('habit-mode',currentMode==='habit');
    const btn=container.querySelector('.speak-btn');
    const label=btn.querySelector('.speak-btn-label');
    btn.style.background='';
    if(currentMode==='habit'){
        btn.querySelector('svg').innerHTML='<path d="M12 22V12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 12C12 8 8 6 4 7c0 4 2 7 8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12c0-4 4-6 8-5 0 4-2 7-8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22c-2 0-3-1-3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 22c2 0 3-1 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
        label.textContent='Habit';
    }else{
        btn.querySelector('svg').innerHTML='<path d="M12 21l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.2L12 21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/><path d="M4 9c1.5-.5 3 .5 3.5 1.5s0 2.5-1 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 7c1-.5 2.5 0 3 1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 13c-1 .5-1.5 2-.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
        label.textContent='Speak';
    }
}

/* Double-tap to toggle mode */
/* moved to top */
const speakBtnMain=document.querySelector('.speak-btn-container .speak-btn');
/* double-tap merged into main touchstart */

/* Android back button / browser history navigation */
window.addEventListener('popstate',e=>{
    if(navHistory.length>0){
        navHistory.pop();
        const overlays=['write-overlay','date-range-overlay','confirm-overlay','mood-filter-overlay','refine-overlay','edit-modal','success-overlay','add-habit-overlay','habit-picker-overlay','habit-entry-overlay','delete-habit-overlay','entry-delete-overlay'];
        for(const oid of overlays){const oel=document.getElementById(oid);if(oel&&(oel.classList.contains('visible'))){oel.classList.remove('visible');return;}}
        const habitDetailScreen=document.getElementById('habit-detail-screen');
        if(habitDetailScreen&&habitDetailScreen.classList.contains('active')){showScreen('habits-screen');return;}
        const detailScreen=document.getElementById('detail-screen');
        if(detailScreen&&detailScreen.classList.contains('active')){showScreen('thoughts-screen');return;}
        const postScreen=document.getElementById('post-record-screen');
        if(postScreen&&postScreen.classList.contains('active')){showScreen('speak-screen');return;}
        const active=document.querySelector('.screen.active');
        if(active&&active.id!=='speak-screen'){showScreen('speak-screen');return;}
        history.back();
    }
});
