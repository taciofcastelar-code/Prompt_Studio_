import { openDB } from 'idb';

const dbPromise = openDB('prompt-studio-v4-1', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('drafts')) {
      const store = db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
      store.createIndex('createdAt', 'createdAt');
    }
    if (!db.objectStoreNames.contains('projects')) {
      const store = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
      store.createIndex('updatedAt', 'updatedAt');
    }
    if (!db.objectStoreNames.contains('prompts')) {
      const store = db.createObjectStore('prompts', { keyPath: 'id', autoIncrement: true });
      store.createIndex('updatedAt', 'updatedAt');
      store.createIndex('projectId', 'projectId');
    }
    if (!db.objectStoreNames.contains('tests')) {
      const store = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
      store.createIndex('createdAt', 'createdAt');
      store.createIndex('promptId', 'promptId');
    }
  }
});

async function add(storeName, value) {
  const db = await dbPromise;
  return db.add(storeName, value);
}
async function put(storeName, value) {
  const db = await dbPromise;
  return db.put(storeName, value);
}
async function list(storeName) {
  const db = await dbPromise;
  return db.getAll(storeName);
}
async function remove(storeName, id) {
  const db = await dbPromise;
  return db.delete(storeName, Number(id));
}

export async function saveProject(project) {
  const now = Date.now();
  if (project.id) return put('projects', { ...project, updatedAt: now });
  return add('projects', { ...project, createdAt: now, updatedAt: now });
}
export async function listProjects() {
  const items = await list('projects');
  return items.sort((a,b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id) { return remove('projects', id); }

export async function savePrompt(prompt) {
  const now = Date.now();
  if (prompt.id) return put('prompts', { ...prompt, updatedAt: now });
  return add('prompts', { ...prompt, createdAt: now, updatedAt: now });
}
export async function listPrompts() {
  const items = await list('prompts');
  return items.sort((a,b) => b.updatedAt - a.updatedAt);
}
export async function deletePrompt(id) { return remove('prompts', id); }

export async function saveTest(test) {
  return add('tests', { ...test, createdAt: Date.now() });
}
export async function listTests() {
  const items = await list('tests');
  return items.sort((a,b) => b.createdAt - a.createdAt);
}
export async function deleteTest(id) { return remove('tests', id); }
