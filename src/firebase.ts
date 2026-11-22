import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ApprovedMemory, JournalEntry, Language } from './types/shongi';
import { deriveAuthSummary, sanitizeFirestoreId } from './utils/shongiLogic';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function subscribeAuthUser(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signInAnonymouslyPrivate(): Promise<User> {
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function signInWithGooglePopup(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signUpWithEmailAndVerify(
  displayName: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const cleanName = displayName.trim();
  if (cleanName) {
    await updateProfile(cred.user, { displayName: cleanName });
  }
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No active user session found.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function refreshAuthUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function upgradeAnonymousWithGoogle(): Promise<User> {
  if (!auth.currentUser) {
    return signInWithGooglePopup();
  }
  const cred = await linkWithPopup(auth.currentUser, googleProvider);
  return cred.user;
}

export async function upgradeAnonymousWithEmail(
  displayName: string,
  email: string,
  password: string
): Promise<User> {
  if (!auth.currentUser) {
    return signUpWithEmailAndVerify(displayName, email, password);
  }
  const emailCred = EmailAuthProvider.credential(email.trim(), password);
  const result = await linkWithCredential(auth.currentUser, emailCred);
  const cleanName = displayName.trim();
  if (cleanName) {
    await updateProfile(result.user, { displayName: cleanName });
  }
  await sendEmailVerification(result.user);
  return result.user;
}

export async function signOutSanctuary(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(
  user: User,
  preferredLanguage: Language
): Promise<{ proactiveCheckins: boolean; ephemeralMode: boolean }> {
  const summary = deriveAuthSummary(user);
  const safeUid = sanitizeFirestoreId(user.uid);
  const profilePath = `users/${safeUid}`;
  const profileRef = doc(db, 'users', safeUid);

  try {
    const existingSnap = await getDoc(profileRef);
    if (!existingSnap.exists()) {
      await setDoc(profileRef, {
        uid: safeUid,
        displayName: summary.displayName.slice(0, 80),
        authMethod: summary.authMethod,
        emailVerified: summary.emailVerified,
        preferredLanguage,
        proactiveCheckins: false,
        ephemeralMode: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { proactiveCheckins: false, ephemeralMode: true };
    }

    const data = existingSnap.data();
    await updateDoc(profileRef, {
      displayName: summary.displayName.slice(0, 80),
      authMethod: summary.authMethod,
      emailVerified: summary.emailVerified,
      preferredLanguage,
      updatedAt: serverTimestamp(),
    });
    return {
      proactiveCheckins: Boolean(data.proactiveCheckins),
      ephemeralMode: data.ephemeralMode !== false,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export async function updateUserConsentPreferences(
  uid: string,
  patch: { proactiveCheckins?: boolean; ephemeralMode?: boolean; preferredLanguage?: Language }
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const path = `users/${safeUid}`;
  try {
    await updateDoc(doc(db, 'users', safeUid), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserMemories(
  uid: string,
  onData: (memories: ApprovedMemory[]) => void
): Unsubscribe {
  const safeUid = sanitizeFirestoreId(uid);
  const path = `users/${safeUid}/memories`;
  const q = query(collection(db, 'users', safeUid, 'memories'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ApprovedMemory[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          text: String(data.text ?? ''),
          meta: String(data.meta ?? 'Synced • Sanctuary Profile'),
          isNew: Boolean(data.isNew),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveMemoryDoc(uid: string, memory: ApprovedMemory): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeMemId = sanitizeFirestoreId(memory.id);
  const path = `users/${safeUid}/memories/${safeMemId}`;
  const docRef = doc(db, 'users', safeUid, 'memories', safeMemId);
  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        text: memory.text.slice(0, 300),
        meta: memory.meta.slice(0, 120),
        isNew: Boolean(memory.isNew),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: safeMemId,
        userId: safeUid,
        text: memory.text.slice(0, 300),
        meta: memory.meta.slice(0, 120),
        isNew: Boolean(memory.isNew),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMemoryDoc(uid: string, memoryId: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeMemId = sanitizeFirestoreId(memoryId);
  const path = `users/${safeUid}/memories/${safeMemId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'memories', safeMemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllMemoryDocs(uid: string, memoryIds: string[]): Promise<void> {
  if (memoryIds.length === 0) return;
  const safeUid = sanitizeFirestoreId(uid);
  const path = `users/${safeUid}/memories`;
  try {
    const batch = writeBatch(db);
    for (const id of memoryIds) {
      batch.delete(doc(db, 'users', safeUid, 'memories', sanitizeFirestoreId(id)));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserJournal(
  uid: string,
  onData: (entries: JournalEntry[]) => void
): Unsubscribe {
  const safeUid = sanitizeFirestoreId(uid);
  const path = `users/${safeUid}/journal`;
  const q = query(collection(db, 'users', safeUid, 'journal'), where('userId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          dateLabel: String(data.dateLabel ?? ''),
          banglaDateLabel:
            typeof data.banglaDateLabel === 'string' ? data.banglaDateLabel : undefined,
          relativeTimeLabel: String(data.relativeTimeLabel ?? ''),
          title: String(data.title ?? ''),
          body: String(data.body ?? ''),
          mood: (data.mood as JournalEntry['mood']) ?? 'Calm',
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          aiLocked: data.aiLocked !== false,
          updatedAtLabel: String(data.updatedAtLabel ?? 'Synced to private cloud'),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveJournalDoc(uid: string, entry: JournalEntry): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeEntryId = sanitizeFirestoreId(entry.id);
  const path = `users/${safeUid}/journal/${safeEntryId}`;
  const docRef = doc(db, 'users', safeUid, 'journal', safeEntryId);

  try {
    const existingSnap = await getDoc(docRef);
    const payload: Record<string, unknown> = {
      id: safeEntryId,
      userId: safeUid,
      dateLabel: entry.dateLabel.slice(0, 60),
      relativeTimeLabel: entry.relativeTimeLabel.slice(0, 60),
      title: entry.title.slice(0, 180),
      body: entry.body.slice(0, 8000),
      mood: entry.mood,
      tags: entry.tags.slice(0, 8).map((t) => String(t).slice(0, 40)),
      aiLocked: Boolean(entry.aiLocked),
      updatedAtLabel: entry.updatedAtLabel.slice(0, 80),
      updatedAt: serverTimestamp(),
    };
    if (entry.banglaDateLabel) {
      payload.banglaDateLabel = entry.banglaDateLabel.slice(0, 60);
    }

    if (existingSnap.exists()) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteJournalDoc(uid: string, entryId: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeEntryId = sanitizeFirestoreId(entryId);
  const path = `users/${safeUid}/journal/${safeEntryId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'journal', safeEntryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
