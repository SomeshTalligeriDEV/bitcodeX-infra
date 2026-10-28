"use client";

import {
  initWasm,
  isWasmInitialized,
} from "@bitcodex/cait-sith-cosmos-compat-wasm";
import * as wasmModule from "@bitcodex/cait-sith-cosmos-compat-wasm/pkg/cait_sith_cosmos_compat_wasm";
import cn from "classnames";
import { useEffect, useState } from "react";

import { Workflow } from "../workflow/workflow";
import styles from "./wasm_example.module.css";

export const WasmExample = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [_result, _setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the WASM module
    async function initialize() {
      try {
        await initWasm(wasmModule, "/pkg/cait_sith_cosmos_compat_wasm_bg.wasm");

        setIsInitialized(isWasmInitialized());
        if (!isWasmInitialized()) {
          setError("Failed to initialize WASM module");
        }
      } catch (err) {
        console.error("WASM initialization error:", err);

        setError(
          `WASM initialization error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    initialize();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Threshold ECDSA Demo</h1>
        <div className={styles.status}>
          <span>Wasm instance: </span>
          {isInitialized ? "Initialized" : "Initializing..."}
        </div>
        {error && (
          <div>
            <span>Wasm error: </span>
            {error}
          </div>
        )}
        <div className={cn({ [styles.isDisabled]: !isInitialized })}>
          <Workflow />
        </div>
      </div>
    </div>
  );
};
