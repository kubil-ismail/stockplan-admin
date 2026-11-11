import { combineReducers, configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

/** Unsaved form input, keyed per form ("tema:<slug|baru>", "emiten:<kode>", "ipo:<kode|baru>"). */
export type Draft = {
  values: unknown;
  base: string; // server `updatedAt` the edits started from; a draft on top of a newer server version is dropped
  extra?: unknown; // UI state that the values alone cannot rebuild (e.g. ticker names in the theme builder)
  savedAt: number;
};

const drafts = createSlice({
  name: "drafts",
  initialState: {} as Record<string, Draft>,
  reducers: {
    setDraft: (s, a: PayloadAction<{ key: string; draft: Draft }>) => { s[a.payload.key] = a.payload.draft; },
    clearDraft: (s, a: PayloadAction<string>) => { delete s[a.payload]; },
  },
});
export const { setDraft, clearDraft } = drafts.actions;

// The server render has no localStorage, so it gets a storage that stores nothing (avoids redux-persist's own warning).
const noop = { getItem: () => Promise.resolve(null), setItem: (_k: string, v: string) => Promise.resolve(v), removeItem: () => Promise.resolve() };
const storage = typeof window === "undefined" ? noop : createWebStorage("local");
const reducer = combineReducers({ drafts: drafts.reducer });

export const store = configureStore({
  reducer: persistReducer({ key: "sp-admin-drafts", storage, whitelist: ["drafts"] }, reducer),
  // redux-persist actions carry functions; everything else in the store is plain form data.
  middleware: (gdm) => gdm({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});
// Only on the client, so the server never touches storage; the first client render equals the server's (empty, not rehydrated).
export const persistor = typeof window === "undefined" ? null : persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export const selectRehydrated = (s: RootState) => !!(s as RootState & { _persist?: { rehydrated: boolean } })._persist?.rehydrated;
