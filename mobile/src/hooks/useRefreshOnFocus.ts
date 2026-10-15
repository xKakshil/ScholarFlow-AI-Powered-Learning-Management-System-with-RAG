import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "expo-router";

export function useRefreshOnFocus(refresh: () => void) {
  const refreshRef = useRef(refresh);
  const firstFocus = useRef(true);

  useEffect(() => {
    refreshRef.current = refresh;
  });

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshRef.current();
    }, []),
  );
}
