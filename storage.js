const STORAGE_KEY='speak_captures',SETTINGS_KEY='speak_settings',HABITS_KEY='speak_habits';
let captures=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
let habits=JSON.parse(localStorage.getItem(HABITS_KEY)||'[]');
let settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
if(!settings.defaultLang)settings.defaultLang='de-DE';
if(!settings.lastBackup)settings.lastBackup=null;
if(!settings.geminiApiKey)settings.geminiApiKey='';

function saveCaptures(){localStorage.setItem(STORAGE_KEY,JSON.stringify(captures));}
function saveHabits(){localStorage.setItem(HABITS_KEY,JSON.stringify(habits));}
function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
