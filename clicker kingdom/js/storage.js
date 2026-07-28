// ---------- Storage API (IndexedDB & LocalStorage) ----------

const DB_NAME = 'ClickerKingdomDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('leaderboard')) db.createObjectStore('leaderboard', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('feedbacks')) db.createObjectStore('feedbacks', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getAccount(id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('accounts', 'readonly');
    const req = tx.objectStore('accounts').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function setAccount(acc) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('accounts', 'readwrite');
    const req = tx.objectStore('accounts').put(acc);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getLeaderboard() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('leaderboard', 'readonly');
    const req = tx.objectStore('leaderboard').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function setLeaderboard(list) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('leaderboard', 'readwrite');
    const store = tx.objectStore('leaderboard');
    store.clear();
    list.forEach(entry => store.put(entry));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFeedbacks() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('feedbacks', 'readonly');
    const req = tx.objectStore('feedbacks').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function saveFeedback(fb) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('feedbacks', 'readwrite');
    const req = tx.objectStore('feedbacks').add(fb);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getSession() {
  const data = localStorage.getItem('ck_session');
  return data ? JSON.parse(data) : null;
}

export async function setSession(id) {
  localStorage.setItem('ck_session', JSON.stringify({ id }));
}

export async function clearSession() {
  localStorage.removeItem('ck_session');
}
