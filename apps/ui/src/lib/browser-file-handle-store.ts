import type { BrowserWorkspaceFileHandle } from "@/lib/browser-workspace-file";

const DATABASE_NAME = "org-tools-browser";
const DATABASE_VERSION = 1;
const STORE_NAME = "workspace";
const ACTIVE_HANDLE_KEY = "active-file-handle";

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });

const runRequest = <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) =>
  openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
        request.onsuccess = () => resolve(request.result);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error("IndexedDB transaction failed."));
        };
      }),
  );

export const readStoredBrowserFileHandle = async (): Promise<BrowserWorkspaceFileHandle | null> => {
  if (typeof indexedDB === "undefined") return null;
  try {
    return (await runRequest("readonly", (store) => store.get(ACTIVE_HANDLE_KEY))) ?? null;
  } catch {
    return null;
  }
};

export const storeBrowserFileHandle = async (
  handle: BrowserWorkspaceFileHandle,
): Promise<boolean> => {
  if (typeof indexedDB === "undefined") return false;
  try {
    await runRequest("readwrite", (store) => store.put(handle, ACTIVE_HANDLE_KEY));
    return true;
  } catch {
    return false;
  }
};

export const clearStoredBrowserFileHandle = async (): Promise<boolean> => {
  if (typeof indexedDB === "undefined") return false;
  try {
    await runRequest("readwrite", (store) => store.delete(ACTIVE_HANDLE_KEY));
    return true;
  } catch {
    return false;
  }
};
