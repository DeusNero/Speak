const STORAGE_KEY='speak_captures',SETTINGS_KEY='speak_settings',HABITS_KEY='speak_habits';
var captures=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
var habits=JSON.parse(localStorage.getItem(HABITS_KEY)||'[]');
var settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
if(!settings.defaultLang)settings.defaultLang='de-DE';
if(!settings.lastBackup)settings.lastBackup=null;
if(!settings.geminiApiKey)settings.geminiApiKey='';

function saveCaptures(){localStorage.setItem(STORAGE_KEY,JSON.stringify(captures));if(typeof sbSyncThoughts==='function')sbSyncThoughts();}
function saveHabits(){localStorage.setItem(HABITS_KEY,JSON.stringify(habits));if(typeof sbSyncHabits==='function')sbSyncHabits();}
function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
