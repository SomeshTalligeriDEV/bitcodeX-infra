// Records the part of the demo that needs no login, on the LIVE site, with a visible cursor:
// the customizable login window and the documentation. Real pages, real clicks; the only
// addition is a drawn cursor, because headless browsers do not render one.
//
//   cd <a folder with `npm i playwright && npx playwright install chromium`>
//   node record_public.mjs [site] [outdir]
//
// Writes outdir/public.webm and outdir/marks.json (caption text + start second of each step).
import { mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const SITE = (process.argv[2] ?? "https://bitcodex-demo.vercel.app").replace(/\/$/, "");
const OUT = process.argv[3] ?? "out";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

// Warm-up (not recorded): wakes sleeping free-plan services and fills the browser cache so
// the recording does not open on a loading spinner.
{
  const w = await browser.newPage();
  await w.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
  await w.getByText("Log in or sign up").waitFor({ timeout: 120000 });
  await w.goto(`${SITE}/docs`, { waitUntil: "domcontentloaded" });
  await w.close();
}

const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
const t0 = Date.now();
const marks = [];
const mark = (text) => marks.push({ t: (Date.now() - t0) / 1000, text });
const wait = (ms) => page.waitForTimeout(ms);

await page.addInitScript(() => {
  const mk = () => {
    if (document.getElementById("__cur")) return;
    const c = document.createElement("div");
    c.id = "__cur";
    c.style.cssText =
      "position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;" +
      "background:rgba(255,255,255,.95);border:2.5px solid #09090b;box-shadow:0 2px 10px rgba(0,0,0,.35);" +
      "pointer-events:none;z-index:2147483647;transition:transform .12s ease;";
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => (c.style.left = e.clientX + "px", c.style.top = e.clientY + "px"), true);
    addEventListener("mousedown", () => (c.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (c.style.transform = "scale(1)"), true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", mk);
  else mk();
});

let cx = 960, cy = 540;
async function moveTo(loc) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) throw new Error("not visible");
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y, { steps: 38 });
  cx = x; cy = y;
  await wait(280);
}
async function click(loc) {
  await moveTo(loc);
  await page.mouse.down(); await wait(90); await page.mouse.up();
}
async function scrollBy(px, ms = 1800) {
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, px / steps);
    await wait(ms / steps);
  }
}

// ---- Login window ----
await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
await page.getByText("Log in or sign up").waitFor({ timeout: 90000 });
await page.mouse.move(cx, cy);
await wait(900);
mark("BitcodeX: embedded wallets for Bittensor");
await wait(5500);

mark("Customize the login window: background, accent colour and sign-in methods");
await click(page.getByRole("button", { name: "Dark background" }));
await wait(1900);
await click(page.getByRole("button", { name: "Light background" }));
await wait(1300);
for (const c of ["#7F56D9", "#2E90FA", "#12B76A"]) {
  await click(page.getByRole("button", { name: `Accent ${c}` }));
  await wait(1500);
}
await click(page.getByRole("button", { name: "Accent black and white" }));
await wait(1100);

mark("Turn sign-in methods on or off: the real login window updates instantly");
await click(page.getByRole("switch", { name: /Google/ }));
await wait(1900);
await click(page.getByRole("switch", { name: /Google/ }));
await wait(1500);

mark("Developers: copy the exact provider and login code for these settings");
await click(page.getByRole("button", { name: /Copy to Clipboard/ }));
await wait(2200);

// ---- Docs ----
await click(page.getByRole("link", { name: /Explore the Docs/ }));
await page.waitForURL("**/docs");
mark("Built-in documentation: quickstart, SDK, server and self-host guides");
await wait(1800);
await scrollBy(520, 2200);
await wait(900);

const nav = async (name, text, down = 700) => {
  await click(page.getByRole("link", { name, exact: true }).first());
  await page.waitForLoadState("domcontentloaded");
  mark(text);
  await wait(1500);
  await scrollBy(down, 2600);
  await wait(1000);
};
await nav("Quickstart", "Quickstart: install, wrap your app, add login, send a transaction", 700);
await nav("Wallet API", "Wallet API: send, stake, hotkeys, permissions and signing", 900);
await nav("Security model", "The key is split between your browser and servers: never in one place", 800);
await nav("Status: what is real", "An honest status page: what is real, what is preview, what is not built", 700);
await wait(1800);
mark("END");

const video = page.video();
await ctx.close();
await browser.close();
const src = await video.path();
renameSync(src, `${OUT}/public.webm`);
writeFileSync(`${OUT}/marks.json`, JSON.stringify(marks, null, 2));
writeFileSync(`${OUT}/trim_start.txt`, String(Math.max(0, marks[0].t - 0.6).toFixed(2)));
console.log(`recorded ${(marks.at(-1).t).toFixed(0)} s -> ${OUT}/public.webm`);
