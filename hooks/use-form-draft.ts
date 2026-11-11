"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { clearDraft, selectRehydrated, setDraft, type RootState } from "@/lib/store";
import { useDebounced } from "./use-debounced";

/**
 * Keeps a Formik form's unsaved input in the persisted Redux store so a refresh does not lose it.
 * - After the store is rehydrated, a stored draft for `key` replaces the form values (once), unless the server version changed (`base`).
 * - Edits are stored (debounced); returning to the initial values removes the entry.
 * - Call the returned `discard()` after a successful save/publish: it drops the entry and makes the current values the new baseline.
 * `extra`/`onRestore` carry UI state that the form values cannot rebuild.
 */
export function useFormDraft<V>({ key, base, values, initial, setValues, extra, onRestore }: {
  key: string; base: string; values: V; initial: V; setValues: (v: V) => void; extra?: unknown; onRestore?: (extra: unknown, values: V) => void;
}) {
  const dispatch = useDispatch();
  const rehydrated = useSelector(selectRehydrated);
  const stored = useSelector((s: RootState) => s.drafts[key]);
  const restored = useRef(false);
  const initialJson = useRef(JSON.stringify(initial));

  // Restore once, as soon as the stored drafts are readable.
  useEffect(() => {
    if (!rehydrated || restored.current) return;
    restored.current = true;
    if (!stored) return;
    if (stored.base !== base) { dispatch(clearDraft(key)); return; }
    setValues(stored.values as V);
    onRestore?.(stored.extra, stored.values as V);
    toast("Isian yang belum disimpan dipulihkan."); // COPY: perlu review
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per rehydrate
  }, [rehydrated]);

  const json = JSON.stringify(values);
  const latest = useRef(json);
  useEffect(() => { latest.current = json; });
  const debounced = useDebounced(json, 400);
  useEffect(() => {
    if (!rehydrated || !restored.current || debounced !== json) return;
    if (json === initialJson.current) { if (stored) dispatch(clearDraft(key)); return; }
    dispatch(setDraft({ key, draft: { values: JSON.parse(json), base, extra, savedAt: Date.now() } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `stored`/`extra` would re-trigger the write they come from
  }, [debounced, rehydrated]);

  return useCallback(() => { initialJson.current = latest.current; dispatch(clearDraft(key)); }, [dispatch, key]);
}
