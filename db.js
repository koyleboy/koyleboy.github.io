const KNMPDB = (function() {
  const DB_NAME = 'KNMusicPlayer';
  const STORE_NAME = 'KNMPfiles';
  const VERSION = 1;
  let db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);

      const req = indexedDB.open(DB_NAME, VERSION);

      req.onerror = (e) => reject(e.target.error);
      req.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      req.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  function getStore(mode = 'readonly') {
    if (!db) throw new Error('DB not opened');
    const tx = db.transaction([STORE_NAME], mode);
    return tx.objectStore(STORE_NAME);
  }

  function addSong(file) {
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const record = { name: file.name, file: file };
      const req = store.add(record);
      req.onsuccess = (e) => {
        const id = e.target.result;
        resolve({ id, name: record.name, file: record.file });
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function getAllSongs() {
    return new Promise((resolve, reject) => {
      const store = getStore('readonly');
      const req = store.getAll();
      req.onsuccess = (e) => {
        resolve(e.target.result || []);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function deleteSong(id) {
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function clearAll() {
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  return {
    open: openDB,
    addSong,
    getAllSongs,
    deleteSong,
    clearAll,
  };
})();

window.KNMPDB = KNMPDB;
