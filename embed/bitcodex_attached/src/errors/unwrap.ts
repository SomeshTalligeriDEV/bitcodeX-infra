import type { Result } from "@bitcodex/stdlib-js";
import { useEffect } from "react";

import type { AppError } from ".";
import { useMemoryState } from "@bitcodex-attached/store/memory";

export function useUnwrap(res: Result<any, AppError>) {
  const { setError } = useMemoryState();

  useEffect(() => {
    if (!res.success) {
      setError(res.err);
    }
  }, [res]);
}
