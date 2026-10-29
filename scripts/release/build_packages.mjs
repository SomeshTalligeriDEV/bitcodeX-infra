// Build the publishable npm packages into release/packages/<name>/ and `npm pack` them
// into release/tarballs/. Nothing is published. Run after `yarn ci build_sdk`:
//   node scripts/release/build_packages.mjs
//
// The monorepo's private workspace packages (@bitcodex/stdlib-js, bitcodex-types, bytes,
// bittensor-chain) are inlined into each package, JS and types, so a published package
// depends only on public npm packages and its published siblings.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const OUT = path.join(ROOT, "release");
const VERSION = "0.1.0";
// The repo has no LICENSE file yet: the owner chooses the licence before publishing.
const LICENSE = process.env.BITCODEX_LICENSE || "UNLICENSED";

const POLKADOT = {
  "@polkadot/api": "17.0.2",
  "@polkadot/extension-inject": "0.64.1",
  "@polkadot/keyring": "14.0.3",
  "@polkadot/types": "17.0.2",
  "@polkadot/util": "14.0.3",
  "@polkadot/util-crypto": "14.0.3",
};

// workspace name -> published name
const SIBLINGS = {
  "@bitcodex/bitcodex-sdk-core": "@bitcodex/sdk-core",
  "@bitcodex/sdk-bittensor": "@bitcodex/sdk-bittensor",
};

// Chains that are not part of the Bittensor-only React package.
const DROPPED = [
  "@bitcodex/bitcodex-sdk-eth",
  "@bitcodex/bitcodex-sdk-cosmos",
  "@bitcodex/bitcodex-sdk-svm",
];

const PACKAGES = [
  {
    name: "@bitcodex/sdk-core",
    dir: "sdk/bitcodex_sdk_core",
    entries: { index: "dist/index.js" },
    types: { index: "dist/index.d.ts" },
    deps: {},
    // Type-only references from the EVM/Cosmos signing types; not needed for Bittensor.
    optionalPeer: {
      viem: ">=2",
      "@keplr-wallet/types": ">=0.12",
      "@cosmjs/amino": ">=0.32",
    },
    description:
      "BitcodeX core: embedded wallet iframe, login and events (chain-agnostic).",
  },
  {
    name: "@bitcodex/sdk-bittensor",
    dir: "sdk/bitcodex_sdk_bittensor",
    entries: { index: "dist/index.js" },
    types: { index: "dist/index.d.ts" },
    deps: {
      "@bitcodex/sdk-core": `^${VERSION}`,
      "@polkadot/api": POLKADOT["@polkadot/api"],
      "@polkadot/extension-dapp": "0.64.1",
      "@polkadot/extension-inject": POLKADOT["@polkadot/extension-inject"],
      "@polkadot/types": POLKADOT["@polkadot/types"],
      "@polkadot/util": POLKADOT["@polkadot/util"],
      "@polkadot/util-crypto": POLKADOT["@polkadot/util-crypto"],
      eventemitter3: "^5.0.1",
      uuid: "^9.0.0",
    },
    description:
      "BitcodeX for Bittensor: social-login coldkey, polkadot.js Signer, send/stake/register, Sign-In with Bittensor.",
  },
  {
    name: "@bitcodex/sdk-react",
    dir: "sdk/bitcodex_sdk_react",
    entries: { index: "dist/index.js", bittensor: "dist/bittensor/index.js" },
    types: { index: "dist/index.d.ts", bittensor: "dist/bittensor/index.d.ts" },
    deps: {
      "@bitcodex/sdk-core": `^${VERSION}`,
      "@bitcodex/sdk-bittensor": `^${VERSION}`,
    },
    peer: { react: ">=18" },
    description:
      "BitcodeX React provider and hooks (useBitcodeX, useBitcodeXBittensor).",
  },
  {
    name: "@bitcodex/server",
    dir: "sdk/bitcodex_server",
    entries: { index: "dist/index.js" },
    types: { index: "dist/index.d.ts" },
    deps: {
      "@polkadot/api": POLKADOT["@polkadot/api"],
      "@polkadot/keyring": POLKADOT["@polkadot/keyring"],
      "@polkadot/types": POLKADOT["@polkadot/types"],
      "@polkadot/util": POLKADOT["@polkadot/util"],
      "@polkadot/util-crypto": POLKADOT["@polkadot/util-crypto"],
    },
    node: ">=22",
    description:
      "BitcodeX for your backend: verify Sign-In with Bittensor, act for users through granted proxies.",
  },
];

/** Public npm deps and published siblings stay external; workspace code is inlined. */
function isExternal(pkg) {
  const keep = new Set([
    ...Object.keys(pkg.deps),
    ...Object.keys(pkg.peer ?? {}),
    ...Object.keys(pkg.optionalPeer ?? {}),
  ]);
  return (id) => {
    if (id.startsWith(".") || path.isAbsolute(id)) {
      return false;
    }
    const sibling = SIBLINGS[id];
    if (sibling && sibling !== pkg.name) {
      return true;
    }
    const base = id.startsWith("@")
      ? id.split("/").slice(0, 2).join("/")
      : id.split("/")[0];
    return keep.has(base) || base === "react" || id.startsWith("react/");
  };
}

/** Rewrite external sibling imports to their published names. */
function siblingPaths(id) {
  return SIBLINGS[id] ?? id;
}

/** EVM/Cosmos/Solana SDKs are not shipped: importing them fails with a clear message. */
function dropChains() {
  const ID = "\0bitcodex-dropped-chain";
  return {
    name: "bitcodex-drop-chains",
    resolveId(source) {
      return DROPPED.includes(source) ? `${ID}:${source}` : null;
    },
    load(id) {
      if (!id.startsWith(ID)) {
        return null;
      }
      const source = id.slice(ID.length + 1);
      return `throw new Error(${JSON.stringify(
        `${source} is not part of @bitcodex/sdk-react: BitcodeX for npm is Bittensor only. Use the bittensor option.`,
      )});`;
    },
  };
}

async function bundleJs(pkg, pkgOut) {
  const bundle = await rollup({
    input: Object.fromEntries(
      Object.entries(pkg.entries).map(([k, v]) => [
        k,
        path.join(ROOT, pkg.dir, v),
      ]),
    ),
    external: isExternal(pkg),
    plugins: [
      dropChains(),
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ["import", "default"],
      }),
    ],
    onwarn(w, warn) {
      if (w.code === "CIRCULAR_DEPENDENCY" || w.code === "THIS_IS_UNDEFINED") {
        return;
      }
      warn(w);
    },
  });
  await bundle.write({
    dir: path.join(pkgOut, "dist"),
    format: "esm",
    entryFileNames: "[name].js",
    chunkFileNames: "chunks/[name]-[hash].js",
    sourcemap: false,
    paths: siblingPaths,
  });
  await bundle.close();
}

async function bundleTypes(pkg, pkgOut) {
  const bundle = await rollup({
    input: Object.fromEntries(
      Object.entries(pkg.types).map(([k, v]) => [
        k,
        path.join(ROOT, pkg.dir, v),
      ]),
    ),
    // Types: inline only @bitcodex/* workspace declarations; every npm package stays
    // an import (resolved from the consumer's node_modules).
    external: (id) =>
      !id.startsWith(".") &&
      !path.isAbsolute(id) &&
      !id.startsWith("\0") &&
      (!id.startsWith("@bitcodex/") || isExternal(pkg)(id)),
    plugins: [
      dropChainsTypes(),
      workspaceTypes(),
      dts({ respectExternal: true }),
    ],
  });
  await bundle.write({
    dir: path.join(pkgOut, "dist"),
    format: "esm",
    entryFileNames: "[name].d.ts",
    chunkFileNames: "chunks/[name]-[hash].d.ts",
    paths: siblingPaths,
  });
  await bundle.close();
}

/** @bitcodex/<pkg>/<sub> -> the built .d.ts of that workspace package (subpath exports). */
function workspaceTypes() {
  const WORKSPACE = {
    "@bitcodex/bitcodex-types": "common/bitcodex_types/dist",
    "@bitcodex/stdlib-js": "lib/stdlib_js/dist",
    "@bitcodex/bytes": "crypto/bytes/dist",
    "@bitcodex/bittensor-chain": "sdk/bitcodex_bittensor_chain/dist",
  };
  return {
    name: "bitcodex-workspace-types",
    resolveId(source) {
      for (const [name, dist] of Object.entries(WORKSPACE)) {
        if (source === name) {
          return path.join(ROOT, dist, "index.d.ts");
        }
        if (source.startsWith(`${name}/`)) {
          const sub = source.slice(name.length + 1);
          return path.join(ROOT, dist, sub, "index.d.ts");
        }
      }
      return null;
    },
  };
}

/** Types of dropped chains collapse to `unknown` so declarations still compile. */
function dropChainsTypes() {
  const ID = "\0bitcodex-dropped-chain-types";
  return {
    name: "bitcodex-drop-chains-types",
    resolveId(source) {
      const base = source.split("/").slice(0, 2).join("/");
      return DROPPED.includes(base) ||
        DROPPED.some((d) => source.startsWith(`${d}/`))
        ? `${ID}:${source}.d.ts`
        : null;
    },
    load(id) {
      if (!id.startsWith(ID)) {
        return null;
      }
      return "declare const x: any;\nexport = x;\n";
    },
  };
}

function packageJson(pkg) {
  const exportsMap = {};
  for (const name of Object.keys(pkg.entries)) {
    const sub = name === "index" ? "." : `./${name}`;
    exportsMap[sub] = {
      types: `./dist/${name}.d.ts`,
      import: `./dist/${name}.js`,
    };
  }
  return {
    name: pkg.name,
    version: VERSION,
    description: pkg.description,
    license: LICENSE,
    type: "module",
    main: "./dist/index.js",
    module: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: exportsMap,
    files: ["dist", "README.md", "NOTICE"],
    sideEffects: false,
    keywords: [
      "bittensor",
      "subtensor",
      "wallet",
      "embedded-wallet",
      "mpc",
      "frost",
      "bitcodex",
    ],
    repository: {
      type: "git",
      url: "git+https://github.com/SomeshTalligeriDEV/bitcodeX-infra.git",
      directory: pkg.dir,
    },
    engines: pkg.node ? { node: pkg.node } : undefined,
    dependencies: Object.keys(pkg.deps).length ? pkg.deps : undefined,
    peerDependencies:
      pkg.peer || pkg.optionalPeer
        ? { ...pkg.peer, ...pkg.optionalPeer }
        : undefined,
    peerDependenciesMeta: pkg.optionalPeer
      ? Object.fromEntries(
          Object.keys(pkg.optionalPeer).map((k) => [k, { optional: true }]),
        )
      : undefined,
    publishConfig: { access: "public" },
  };
}

function readme(pkg) {
  const release = path.join(
    ROOT,
    "scripts/release/readme",
    `${pkg.name.replace("@bitcodex/", "")}.md`,
  );
  try {
    return readFileSync(release, "utf8");
  } catch {
    // fall back to the package's own README
  }
  const own = path.join(ROOT, pkg.dir, "README.md");
  try {
    return readFileSync(own, "utf8");
  } catch {
    return `# ${pkg.name}\n\n${pkg.description}\n\nSee https://github.com/SomeshTalligeriDEV/bitcodeX-infra.\n`;
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, "tarballs"), { recursive: true });

for (const pkg of PACKAGES) {
  const pkgOut = path.join(OUT, "packages", pkg.name.replace("@bitcodex/", ""));
  mkdirSync(pkgOut, { recursive: true });
  await bundleJs(pkg, pkgOut);
  await bundleTypes(pkg, pkgOut);
  writeFileSync(
    path.join(pkgOut, "package.json"),
    `${JSON.stringify(packageJson(pkg), null, 2)}\n`,
  );
  writeFileSync(path.join(pkgOut, "README.md"), readme(pkg));
  cpSync(path.join(ROOT, "NOTICE"), path.join(pkgOut, "NOTICE"));
  const out = execFileSync(
    "npm",
    ["pack", "--pack-destination", path.join(OUT, "tarballs")],
    {
      cwd: pkgOut,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  console.log(`packed ${pkg.name}: ${out.trim().split("\n").pop()}`);
}
