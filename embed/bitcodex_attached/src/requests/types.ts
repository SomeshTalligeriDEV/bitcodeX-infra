export type FetchError =
  | {
      type: "fetch_error";
      err: any;
    }
  | {
      type: "status_fail";
      status: number;
    }
  | {
      type: "json_parse_fail";
      err: any;
    };

/** Readable text for a failed request (an object's toString() is "[object Object]"). */
export function describeFetchError(e: FetchError): string {
  switch (e.type) {
    case "status_fail":
      return `the server answered HTTP ${e.status}`;
    case "json_parse_fail":
      return "the server sent an unreadable response";
    default:
      return `could not reach the server (${e.err instanceof Error ? e.err.message : String(e.err)})`;
  }
}
