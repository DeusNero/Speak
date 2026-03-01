/* Client-side encryption — PBKDF2 key derivation + AES-GCM encrypt/decrypt */

var _encKey = null;
var _ENC_DB = 'speak-keys';
var _ENC_STORE = 'keystore';

function _encOpenDB() {
    return new Promise(function (res, rej) {
        var r = indexedDB.open(_ENC_DB, 1);
        r.onupgradeneeded = function (e) { e.target.result.createObjectStore(_ENC_STORE); };
        r.onsuccess = function (e) { res(e.target.result); };
        r.onerror = function (e) { rej(e.target.error); };
    });
}

async function encSaveKey(key) {
    try {
        var db = await _encOpenDB();
        return new Promise(function (res, rej) {
            var tx = db.transaction(_ENC_STORE, 'readwrite');
            tx.objectStore(_ENC_STORE).put(key, 'enc-key');
            tx.oncomplete = res;
            tx.onerror = function (e) { rej(e.target.error); };
        });
    } catch (e) { console.warn('encSaveKey failed', e); }
}

async function encLoadKey() {
    try {
        var db = await _encOpenDB();
        return new Promise(function (res, rej) {
            var tx = db.transaction(_ENC_STORE, 'readonly');
            var r = tx.objectStore(_ENC_STORE).get('enc-key');
            r.onsuccess = function (e) { res(e.target.result || null); };
            r.onerror = function (e) { rej(e.target.error); };
        });
    } catch (e) { console.warn('encLoadKey failed', e); return null; }
}

async function encClearKey() {
    try {
        var db = await _encOpenDB();
        return new Promise(function (res, rej) {
            var tx = db.transaction(_ENC_STORE, 'readwrite');
            tx.objectStore(_ENC_STORE).delete('enc-key');
            tx.oncomplete = res;
            tx.onerror = function (e) { rej(e.target.error); };
        });
    } catch (e) { console.warn('encClearKey failed', e); }
}

async function encDeriveKey(password, userId) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    var salt = enc.encode('speak-salt-' + userId);
    var key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    _encKey = key;
    await encSaveKey(key);
    return key;
}

async function encEncrypt(plaintext) {
    if (!_encKey || !plaintext) return plaintext;
    try {
        var enc = new TextEncoder();
        var iv = crypto.getRandomValues(new Uint8Array(12));
        var encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv }, _encKey, enc.encode(plaintext)
        );
        var buf = new Uint8Array(iv.length + encrypted.byteLength);
        buf.set(iv);
        buf.set(new Uint8Array(encrypted), iv.length);
        return 'enc:' + btoa(String.fromCharCode.apply(null, buf));
    } catch (e) { console.error('Encrypt failed', e); return plaintext; }
}

async function encDecrypt(ciphertext) {
    if (!_encKey || !ciphertext || typeof ciphertext !== 'string') return ciphertext;
    if (!ciphertext.startsWith('enc:')) return ciphertext;
    try {
        var raw = atob(ciphertext.slice(4));
        var buf = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
        var iv = buf.slice(0, 12);
        var data = buf.slice(12);
        var decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv }, _encKey, data
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) { console.error('Decrypt failed', e); return ciphertext; }
}

async function encInitFromStorage() {
    var stored = await encLoadKey();
    if (stored) { _encKey = stored; return true; }
    return false;
}
