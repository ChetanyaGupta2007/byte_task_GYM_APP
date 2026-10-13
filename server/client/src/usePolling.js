import { useEffect, useRef } from "react";

export function usePolling(callback, ms, paused) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  });

  useEffect(() => {
    if (paused) {
      return;
    }

    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms, paused]);
}