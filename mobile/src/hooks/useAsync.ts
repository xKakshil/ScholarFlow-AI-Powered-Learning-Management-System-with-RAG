import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

type Result<T> = { key: string | null; data: T | null; error: string | null };

export function useAsync<T>(fn: () => Promise<T>, key = "") {
  const fnRef = useRef(fn);
  const mounted = useRef(true);
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null });
  const [busy, setBusy] = useState<"reload" | "refresh" | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    fnRef.current = fn;
  });

  const load = useCallback(async (forKey: string) => {
    const timer = setTimeout(() => mounted.current && setSlow(true), 4000);
    try {
      const data = await fnRef.current();
      if (mounted.current) setResult({ key: forKey, data, error: null });
    } catch (e) {
      if (mounted.current) setResult((prev) => ({ key: forKey, data: prev.data, error: errorMessage(e) }));
    } finally {
      clearTimeout(timer);
      if (mounted.current) {
        setSlow(false);
        setBusy(null);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load(key);
    return () => {
      mounted.current = false;
    };
  }, [key, load]);

  const isCurrent = result.key === key;

  return {
    data: result.data,
    error: isCurrent && busy === null ? result.error : null,
    loading: !isCurrent || busy === "reload",
    refreshing: busy === "refresh",
    slow,
    reload: () => {
      setBusy("reload");
      void load(key);
    },
    refresh: () => {
      setBusy("refresh");
      void load(key);
    },
  };
}
