import { db } from './firebase-config.js';
import {
  collection, query, where, getDocs, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";

export async function createList(ownerId, { name, color, icon }) {
  const listsRef = collection(db, 'lists');
  const docRef = await addDoc(listsRef, {
    name, color, icon,
    ownerId,
    sharedWith: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTasksForList(listId) {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('listId', '==', listId), orderBy('dueDate', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createTask(listId, createdBy, { title, notes, dueDate, recurrence }) {
  const tasksRef = collection(db, 'tasks');
  const docRef = await addDoc(tasksRef, {
    listId, createdBy,
    title,
    notes: notes || '',
    dueDate: dueDate || null,
    recurrence: recurrence || null,
    done: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function computeNextDueDate(dueDate, recurrenceType) {
  const d = new Date(dueDate + 'T00:00:00');
  if (recurrenceType === 'daily') d.setDate(d.getDate() + 1);
  else if (recurrenceType === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrenceType === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Note: this now takes the full task object, not just its id — it needs
// title/notes/recurrence/dueDate to spawn the next occurrence.
export async function toggleTaskDone(task, done) {
  await updateDoc(doc(db, 'tasks', task.id), { done });
  if (done && task.recurrence && task.dueDate) {
    const nextDueDate = computeNextDueDate(task.dueDate, task.recurrence);
    await createTask(task.listId, task.createdBy, {
      title: task.title,
      notes: task.notes,
      dueDate: nextDueDate,
      recurrence: task.recurrence,
    });
  }
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'tasks', taskId));
}

// Returns an array of list documents (id + data) that the given user can access:
// either because they own it, or because they're in its sharedWith array.
export async function getAccessibleLists(uid) {
  const listsRef = collection(db, 'lists');

  const ownedQuery = query(listsRef, where('ownerId', '==', uid));
  const sharedQuery = query(listsRef, where('sharedWith', 'array-contains', uid));

  const [ownedSnap, sharedSnap] = await Promise.all([
    getDocs(ownedQuery),
    getDocs(sharedQuery)
  ]);

  const listsById = new Map();
  ownedSnap.forEach(doc => listsById.set(doc.id, { id: doc.id, ...doc.data() }));
  sharedSnap.forEach(doc => listsById.set(doc.id, { id: doc.id, ...doc.data() }));

  return Array.from(listsById.values());
}

// Returns tasks across the given list IDs, optionally filtered by completion
// status, sorted by due date (server-side) or left for client-side list-name sort.
export async function getMergedTasks(listIds, { doneFilter = null, sortBy = 'dueDate' } = {}) {
  if (listIds.length === 0) return [];
  if (listIds.length > 30) {
    console.warn('More than 30 lists — Firestore "in" queries cap at 30. Not handled yet.');
  }

  const tasksRef = collection(db, 'tasks');
  const constraints = [where('listId', 'in', listIds.slice(0, 30))];

  if (doneFilter !== null) {
    constraints.push(where('done', '==', doneFilter));
  }

  // Only ask Firestore to sort by due date. List-name sort happens client-side,
  // since listName isn't stored on the task document (by design — see spec).
  if (sortBy === 'dueDate') {
    constraints.push(orderBy('dueDate', 'asc'));
  }

  const q = query(tasksRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Sorts tasks by their parent list's name, using the lists array from getAccessibleLists().
export function sortTasksByListName(tasks, lists) {
  const nameById = new Map(lists.map(l => [l.id, l.name]));
  return [...tasks].sort((a, b) => {
    const nameA = nameById.get(a.listId) || '';
    const nameB = nameById.get(b.listId) || '';
    return nameA.localeCompare(nameB);
  });
}

window.APP.firebase.getAccessibleLists = getAccessibleLists;
window.APP.firebase.getMergedTasks = getMergedTasks;
window.APP.firebase.sortTasksByListName = sortTasksByListName;
window.APP.firebase.createList = createList;
window.APP.firebase.getTasksForList = getTasksForList;
window.APP.firebase.createTask = createTask;
window.APP.firebase.toggleTaskDone = toggleTaskDone;
window.APP.firebase.deleteTask = deleteTask;