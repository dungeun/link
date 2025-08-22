import { useCallback, useEffect, useRef } from "react";

export function useWebWorker(workerScript: string) {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof Worker !== "undefined") {
      try {
        const worker = new Worker(workerScript);
        workerRef.current = worker;

        worker.onmessage = (e) => {
          const { type, data } = e.data;
          const callback = callbacksRef.current.get(type);
          if (callback) {
            callback(data);
          }
        };

        worker.onerror = (error) => {
          console.error("Worker error:", error);
        };

        return () => {
          worker.terminate();
        };
      } catch (error) {
        console.warn("Failed to create worker:", error);
      }
    }
  }, [workerScript]);

  const postMessage = useCallback(
    (type: string, data: any, callback?: (data: any) => void) => {
      if (workerRef.current) {
        if (callback) {
          callbacksRef.current.set(
            type.replace("_REQUEST", "_RESPONSE"),
            callback,
          );
        }
        workerRef.current.postMessage({ type, data });
      } else {
        // Fallback for environments without Web Worker support
        console.warn("Web Worker not available, running on main thread");
        if (callback) {
          // Simulate async processing
          setTimeout(() => callback(data), 0);
        }
      }
    },
    [],
  );

  const subscribe = useCallback(
    (type: string, callback: (data: any) => void) => {
      callbacksRef.current.set(type, callback);

      return () => {
        callbacksRef.current.delete(type);
      };
    },
    [],
  );

  return { postMessage, subscribe };
}
