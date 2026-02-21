function cleanupTranscript(r){if(!r||!r.trim())return r;let t=r.trim();
/* Capitalize first letter */
t=t.charAt(0).toUpperCase()+t.slice(1);
/* Fix standalone i */
t=t.replace(/\bi\b(?=\s|'|$)/g,'I');
/* Add commas before common conjunctions if missing */
t=t.replace(/\s+(but|and|so|because|although|however|yet|or)\s+/gi,(m,w)=>{if(m.charAt(0)===',')return m;return', '+w.toLowerCase()+' ';});
/* Detect question patterns and add question marks */
t=t.replace(/((?:^|[.!?]\s+)(?:what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|don't|doesn't|isn't|aren't|won't|wouldn't|couldn't|shouldn't|haven't|hasn't|wer|wie|wo|wann|warum|wieso|weshalb|ist|sind|hat|hatte|kann|kannst|soll|sollte|willst|hast|bist)[^.!?]*)/gi,(m)=>{return m.trimEnd();});
t=t.replace(/((?:what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|don't|doesn't|isn't|aren't|won't|wouldn't|wer|wie|wo|wann|warum|wieso|weshalb|ist|sind|hat|kann|soll|willst|hast|bist)[^.!?]{3,}?)(\s+(?:[A-Z])|$)/gi,(m,q,after)=>{if(/[.!?]$/.test(q.trim()))return m;return q.trim()+'?'+after;});
/* Split long run-on sentences at natural break points */
t=t.replace(/(.{80,}?)\s+(and|but|so|also|then|because|und|aber|also|dann|weil)\s+/g,(m,before,conj)=>{if(/[.!?,]$/.test(before.trim()))return m;return before.trim()+'. '+conj.charAt(0).toUpperCase()+conj.slice(1)+' ';});
/* Capitalize after sentence-ending punctuation */
t=t.replace(/([.!?])\s+([a-z\u00e4\u00f6\u00fc\u00df])/g,(m,p,c)=>p+' '+c.toUpperCase());
/* Add period at end if missing */
if(!/[.!?]$/.test(t))t+='.';
/* Clean up double spaces */
t=t.replace(/\s{2,}/g,' ');
/* Clean up double punctuation */
t=t.replace(/([.!?]){2,}/g,'$1');
return t;}

async function refineText(raw,lang){
    if(!settings.geminiApiKey){console.warn('No API key');return{text:localRefine(raw),source:'local'};}
    try{
        const prompt='You are a precise text editor. The following is raw voice input or quickly typed text. Auto-detect the language and correct it accordingly.\n\nRules:\n1. Detect the primary language (German, English, or mixed) and apply that language\'s grammar rules\n2. Fix all grammar errors (case, articles, verb conjugation, subject-verb agreement, tense)\n3. Add correct punctuation and capitalization\n4. For German: capitalize all nouns, fix umlaut errors (ue→ü, oe→ö, ae→ä, ss→ß where appropriate), join compound words correctly\n5. For English: fix homophones (their/there, your/you\'re, to/too/two), contractions\n6. IMPORTANT: If English words are used within German text (e.g. Meeting, Feedback, Team, cool, nice), keep them as-is — this is intentional code-switching, not an error\n7. Turn fragments, run-ons, or shorthand into clean complete sentences\n8. Fix speech recognition errors and misheard words\n9. Keep the personal tone and original meaning — improve correctness, not formality\n\nRespond with ONLY the corrected text, no explanations.\n\nOriginal text:\n'+raw;
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key='+settings.geminiApiKey,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3}})
        });
        if(!r.ok){
            const errBody=await r.text();console.error('Gemini API error:',r.status,errBody);
            let errMsg='API error: '+r.status;
            if(r.status===429)errMsg='Too many requests — wait a moment and try again';
            else if(r.status===400)errMsg='Invalid request — check your API key';
            else if(r.status===403)errMsg='Access denied — API key may be invalid or expired';
            else if(r.status===500||r.status===503)errMsg='Gemini is temporarily unavailable — try again shortly';
            return{text:localRefine(raw),source:'local',error:errMsg};
        }
        const d=await r.json();
        console.log('Gemini response:',JSON.stringify(d).substring(0,500));
        const txt=d.candidates?.[0]?.content?.parts?.[0]?.text;
        if(txt)return{text:txt.trim(),source:'gemini'};
        return{text:localRefine(raw),source:'local',error:'Empty API response'};
    }catch(e){console.error('Gemini failed:',e);return{text:localRefine(raw),source:'local',error:e.message};}
}
function localRefine(t){return cleanupTranscript(t);}
