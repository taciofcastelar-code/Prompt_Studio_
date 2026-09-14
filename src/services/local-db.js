import { openDB } from 'idb';
const DB='prompt-studio-v4-2';
const STORES=['projects','prompts','tests','templates','workflows','issues'];
const dbPromise=openDB(DB,1,{upgrade(db){for(const name of STORES){if(!db.objectStoreNames.contains(name)){const s=db.createObjectStore(name,{keyPath:'id',autoIncrement:true});s.createIndex('updatedAt','updatedAt');}}}});
async function addOrPut(store,value){const db=await dbPromise;const now=Date.now();const payload={...value,updatedAt:now};if(value.id)return db.put(store,payload);return db.add(store,{...payload,createdAt:now});}
async function all(store){const db=await dbPromise;const items=await db.getAll(store);return items.sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));}
async function del(store,id){const db=await dbPromise;return db.delete(store,Number(id));}
export const saveProject=v=>addOrPut('projects',v); export const listProjects=()=>all('projects'); export const deleteProject=id=>del('projects',id);
export const savePrompt=v=>addOrPut('prompts',v); export const listPrompts=()=>all('prompts'); export const deletePrompt=id=>del('prompts',id);
export const saveTest=v=>addOrPut('tests',v); export const listTests=()=>all('tests'); export const deleteTest=id=>del('tests',id);
export const saveTemplate=v=>addOrPut('templates',v); export const listTemplates=()=>all('templates'); export const deleteTemplate=id=>del('templates',id);
export const saveWorkflow=v=>addOrPut('workflows',v); export const listWorkflows=()=>all('workflows'); export const deleteWorkflow=id=>del('workflows',id);
export const saveIssue=v=>addOrPut('issues',v); export const listIssues=()=>all('issues'); export const deleteIssue=id=>del('issues',id);

export async function exportAllData(){const out={version:'4.2',exportedAt:new Date().toISOString()};for(const s of STORES)out[s]=await all(s);return out;}
export async function importAllData(data){const db=await dbPromise;for(const s of STORES){if(!Array.isArray(data[s]))continue;const tx=db.transaction(s,'readwrite');for(const item of data[s])await tx.store.put(item);await tx.done;}}
export async function clearAllData(){const db=await dbPromise;for(const s of STORES)await db.clear(s);}
