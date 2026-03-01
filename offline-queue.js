/* Offline recording queue — IndexedDB storage for failed transcriptions */
/* PASSIVE UTILITY: defines functions only, never auto-executes anything */

var _oqDB = 'speak-offline-queue';
var _oqStore = 'pending';

function _oqOpen() {
    return new Promise(function (res, rej) {
        var r = indexedDB.open(_oqDB, 1);
        r.onupgradeneeded = function (e) { e.target.result.createObjectStore(_oqStore, { keyPath: 'id', autoIncrement: true }); };
        r.onsuccess = function (e) { res(e.target.result); };
        r.onerror = function (e) { rej(e.target.error); };
    });
}

function oqSave(blob, mime, lang, mode, meta) {
    return _oqOpen().then(function (db) {
        return new Promise(function (res, rej) {
            var tx = db.transaction(_oqStore, 'readwrite');
            tx.objectStore(_oqStore).add({
                blob: blob,
                mime: mime || 'audio/webm',
                lang: lang || 'en-US',
                mode: mode || 'thought',
                meta: meta || null,
                createdAt: new Date().toISOString()
            });
            tx.oncomplete = res;
            tx.onerror = function (e) { rej(e.target.error); };
        });
    });
}

function oqGetAll() {
    return _oqOpen().then(function (db) {
        return new Promise(function (res, rej) {
            var tx = db.transaction(_oqStore, 'readonly');
            var r = tx.objectStore(_oqStore).getAll();
            r.onsuccess = function (e) { res(e.target.result || []); };
            r.onerror = function (e) { rej(e.target.error); };
        });
    });
}

function oqDelete(id) {
    return _oqOpen().then(function (db) {
        return new Promise(function (res, rej) {
            var tx = db.transaction(_oqStore, 'readwrite');
            tx.objectStore(_oqStore).delete(id);
            tx.oncomplete = res;
            tx.onerror = function (e) { rej(e.target.error); };
        });
    });
}

function oqCount() {
    return _oqOpen().then(function (db) {
        return new Promise(function (res, rej) {
            var tx = db.transaction(_oqStore, 'readonly');
            var r = tx.objectStore(_oqStore).count();
            r.onsuccess = function (e) { res(e.target.result); };
            r.onerror = function (e) { rej(e.target.error); };
        });
    });
}
