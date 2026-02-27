function normalizeSharpS(t){return (t||'').replace(/ß/g,'ss');}
function cleanupTranscript(r,lang){if(!r||!r.trim())return r;let t=r.trim();
/* Capitalize first letter */
t=t.charAt(0).toUpperCase()+t.slice(1);
/* Fix standalone i */
t=t.replace(/\bi\b(?=\s|'|$)/g,'I');
/* Capitalize after sentence-ending punctuation */
t=t.replace(/([.!?])\s+([a-z\u00e4\u00f6\u00fc\u00df])/g,(m,p,c)=>p+' '+c.toUpperCase());
/* Add period at end if missing */
if(!/[.!?]$/.test(t))t+='.';
/* Clean up double spaces */
t=t.replace(/\s{2,}/g,' ');
/* Clean up double punctuation */
t=t.replace(/([.!?]){2,}/g,'$1');
return normalizeSharpS(t);}

async function refineText(raw,lang){
    if(!settings.geminiApiKey){console.warn('No API key');return{text:localRefine(raw,lang),source:'local'};}
    try{
        const prompt='You are a precise text editor. The following is raw voice input or quickly typed text. Auto-detect the language and correct it accordingly.\n\nRules:\n1. Detect the primary language (German, English, or mixed) and apply that language\'s grammar rules\n2. Fix all grammar errors (case, articles, verb conjugation, subject-verb agreement, tense)\n3. Add correct punctuation and capitalization\n4. For German: capitalize all nouns, fix umlaut errors (ue→ü, oe→ö, ae→ä), and join compound words correctly\n5. For English: fix homophones (their/there, your/you\'re, to/too/two), contractions\n6. IMPORTANT: If English words are used within German text (e.g. Meeting, Feedback, Team, cool, nice), keep them as-is — this is intentional code-switching, not an error\n7. Turn fragments, run-ons, or shorthand into clean complete sentences\n8. Fix speech recognition errors and misheard words\n9. Keep the personal tone and original meaning — improve correctness, not formality\n10. Never use the character ß; always use ss instead\n11. Break the text into multiple paragraphs at natural topic transitions or thought shifts. Each paragraph should be 2-4 sentences. Insert a blank line between paragraphs. Short texts (1-3 sentences) can remain a single paragraph\n\nRespond with ONLY the corrected text, no explanations.\n\nOriginal text:\n'+raw;
        const models=['gemini-2.5-flash-lite','gemini-2.5-flash','gemini-2.0-flash','gemini-2.0-flash-lite'];
        let last404=false;
        for(const model of models){
            const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+settings.geminiApiKey,{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3}})
            });
            if(r.ok){
                const d=await r.json();
                console.log('Gemini response ('+model+'):',JSON.stringify(d).substring(0,500));
                const txt=d.candidates?.[0]?.content?.parts?.[0]?.text;
                if(txt)return{text:normalizeSharpS(txt.trim()),source:'gemini',model:model};
                return{text:localRefine(raw,lang),source:'local',error:'Empty API response'};
            }
            const errBody=await r.text();console.error('Gemini API error ('+model+'):',r.status,errBody);
            if(r.status===404){last404=true;continue;}
            let errMsg='API error: '+r.status;
            if(r.status===429)errMsg='Too many requests — wait a moment and try again';
            else if(r.status===400)errMsg='Invalid request — check your API key';
            else if(r.status===403)errMsg='Access denied — API key may be invalid or expired';
            else if(r.status===500||r.status===503)errMsg='Gemini is temporarily unavailable — try again shortly';
            return{text:localRefine(raw,lang),source:'local',error:errMsg};
        }
        if(last404)return{text:localRefine(raw,lang),source:'local',error:'No compatible Gemini model found for this API key/project (404).'};
        return{text:localRefine(raw,lang),source:'local',error:'Gemini request failed.'};
    }catch(e){console.error('Gemini failed:',e);return{text:localRefine(raw,lang),source:'local',error:e.message};}
}
function localRefine(t,lang){return cleanupTranscript(t,lang);}

function getAudioMimeType(){
    if(MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))return 'audio/webm;codecs=opus';
    if(MediaRecorder.isTypeSupported('audio/webm'))return 'audio/webm';
    if(MediaRecorder.isTypeSupported('audio/ogg;codecs=opus'))return 'audio/ogg;codecs=opus';
    return '';}
function useGeminiTranscription(){
    return !!(settings.geminiApiKey&&(MediaRecorder.isTypeSupported('audio/webm')||MediaRecorder.isTypeSupported('audio/ogg')));}
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onloadend=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});}
async function transcribeAudio(blob,lang){
    if(!settings.geminiApiKey)return null;
    try{
        const b64=await blobToBase64(blob);
        const mime=blob.type.split(';')[0]||'audio/webm';
        const langHint=lang&&lang.startsWith('de')?'German (speaker may mix in English words/names — transcribe them exactly as heard)':'English (speaker may mix in German words — transcribe them exactly as heard)';
        const prompt='Transcribe this audio exactly as spoken. Primary language: '+langHint+'. Preserve all words including filler words. Insert paragraph breaks (double newlines) at natural topic shifts or longer pauses. Output ONLY the transcription, nothing else.';
        const models=['gemini-2.5-flash','gemini-2.5-flash-lite'];
        for(const model of models){
            const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+settings.geminiApiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{inline_data:{mime_type:mime,data:b64}},{text:prompt}]}],generationConfig:{temperature:0}})});
            if(r.ok){const d=await r.json();const txt=d.candidates?.[0]?.content?.parts?.[0]?.text;if(txt)return normalizeSharpS(txt.trim());}
            const err=await r.text();console.error('Gemini transcribe ('+model+'):',r.status,err);
            if(r.status===404)continue;
            return null;
        }
        return null;
    }catch(e){console.error('Gemini transcription failed:',e);return null;}
}
