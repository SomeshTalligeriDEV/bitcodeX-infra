import type { Call } from "@polkadot/types/interfaces";

import type { PlainCall } from "./describe";

const CALL_TYPES = new Set(["Call", "RuntimeCall"]);
const CALL_VEC_TYPES = new Set(["Vec<Call>", "Vec<RuntimeCall>"]);

/**
 * Decoded call -> plain JSON args, with nested calls (batch, proxy, asDerivative) split
 * into `inner` so a call hidden inside another is still shown.
 */
export function toPlainCall(call: Call): PlainCall {
  const args: Record<string, unknown> = {};
  const inner: PlainCall[] = [];
  call.meta.args.forEach((meta, i) => {
    const name = meta.name.toString();
    const typeName = meta.type.toString();
    const value = call.args[i];
    if (CALL_TYPES.has(typeName)) {
      inner.push(toPlainCall(value as Call));
    } else if (CALL_VEC_TYPES.has(typeName)) {
      for (const c of value as unknown as Call[]) {
        inner.push(toPlainCall(c));
      }
    } else {
      args[name] = value.toJSON();
    }
  });
  return { section: call.section, method: call.method, args, inner };
}
