import { openDB } from 'idb';

const dbPromise = openDB('prompt-studio-v4-1', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('drafts')) {
      const store = db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
      store.createIndex('createdAt', 'createdAt');
    }
  }
});

export async function saveDraft(text) {
  const db = await dbPromise;
  return db.add('drafts', { text, createdAt: Date.now() });
}

export async function listDrafts() {
  const db = await dbPromise;
  const items = await db.getAll('drafts');
  return items.sort((a,b) => b.createdAt - a.createdAt).slice(0, 10);
}
