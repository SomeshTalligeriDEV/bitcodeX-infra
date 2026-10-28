import assert from "node:assert/strict";
import test from "node:test";

import { buildSignOutUrl } from "./sign_out_url";

test("buildSignOutUrl includes client_random in hash", () => {
  const url = new URL(
    buildSignOutUrl(
      "http://localhost:3207",
      "bitcodexwallet",
      "1234567890abcdef",
    ),
  );

  assert.equal(url.pathname, "/mobile/sign-out");
  assert.equal(url.searchParams.get("host_origin"), "http://localhost:3207");
  assert.equal(url.searchParams.get("redirect_scheme"), "bitcodexwallet");
  assert.equal(url.hash, "#client_random=1234567890abcdef");
});

test("buildSignOutUrl omits hash when client_random is missing", () => {
  const url = new URL(
    buildSignOutUrl("http://localhost:3207", "bitcodexwallet"),
  );

  assert.equal(url.hash, "");
});
