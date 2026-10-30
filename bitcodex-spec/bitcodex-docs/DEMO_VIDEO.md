# Demo video: record once, build with one command

A silent, captioned, ~3.5 minute demo of everything that works, recorded for real on the
**local test chain** (a real Bittensor chain with a working faucet). Testnet has no free
TAO, so send, stake and hotkeys can only be shown for real on local.

No voice, no music, no simulated footage: the video is your real screen. The script only adds
a title card, captions and an end card.

## 1. Pre-flight (10 minutes, once)

```bash
colima start
scripts/dev-up.sh --fast                          # API, key share nodes, wallet frame, demo (about 3 min)
node sdk/bitcodex_bittensor_chain/scripts/seed_localnet.mjs   # subnet 2 and a validator
cd apps/demo_web && node ../../scripts/video/new_address.mjs  # run twice: one HOTKEY, one RECIPIENT
```

Write the two addresses down. Then check:

- [ ] `http://localhost:3200` loads in under a second.
- [ ] Google login works for your **test user** Gmail (consent screen → Audience → Test users).
- [ ] Use a **clean Chrome profile** (or a guest window) with only that one Google account, so
      no other accounts or emails appear in the Google picker.
- [ ] Window 1600×900 (or full screen at 1920×1080), zoom 100–110 %, bookmarks bar and
      extensions hidden, DevTools closed, Do Not Disturb on (no notification banners).
- [ ] Dry run the whole script once before recording. Faucet, send, stake, hotkey and
      permission all need a **fresh** user the first time, so use a second Gmail or
      "Sign out" and use a new account for the real take.

## 2. Shot list (about 3:30, raw recording time)

| Time | Where | What you do (move the mouse slowly, pause about 1 s after each result) |
|---|---|---|
| 0:00 | `localhost:3200` signed out | Hold still for 7 s so the title caption can sit. |
| 0:07 | Customize sidebar | Click **Dark** then **Light** background. Click two accent swatches, then back to black and white. Switch **Google** off and on. |
| 0:15 | Center login card | Point at the card: it follows the settings. Click **Explore the Docs** hover only, do not click yet. |
| 0:24 | Login card | Click **Google**, pick the account, wait for the popup to close. |
| 0:36 | Account card | Show the address starting with **5**. Click **Copy**, then **Receive** (QR), then hide it. |
| 0:48 | Account card | Balance is 0. Click **Get 1000 test TAO**. Watch the balance change live. |
| 1:02 | **Send TAO** card | Paste the RECIPIENT address, enter `1`. Click **Show code** (2 s), then **Send**. In the popup read the amount, destination and fee, then **Approve**. |
| 1:20 | Result and **Activity** | Show the tx hash and the new Activity row. |
| 1:32 | **Sign and verify** card | Type a message, **Sign**, show **Verified**. |
| 1:48 | **Stake** card | Pick subnet 2, enter `5`, show the quote and slippage, click **Stake**, approve. |
| 2:08 | **Your stake** | Show the position and the changed balance. |
| 2:24 | **Hotkeys** panel | Paste the HOTKEY address, **Add**. Pick subnet 2, show the cost, **Register**, approve. Show UID in the list. |
| 2:44 | **Agent permissions** | Grant the `SmallTransfer` permission, show it listed, then **Revoke**. |
| 3:02 | Right card, then back | Scroll to the top, click **Copy to Clipboard** on the export card. |
| 3:14 | `/docs` | Click **Explore the Docs**. Show Quickstart, then scroll the Wallet API table. Stop on the Status page. |
| 3:30 | End | Stop recording. |

**Optional 25 s add-on** (user dashboard, `localhost:3206`): export key and the two-factor
setting. Only add it if you have time to rehearse it; keep the video under 4 minutes.

## 3. Record

- macOS: press **⇧⌘5**, choose **Record Selected Portion** (drag over the browser) or the
  full screen, **Options → Save to Desktop**, **no microphone**, **Show Mouse Clicks** on.
  Stop with the menu-bar button. This gives a `.mov`.
- One continuous take is easiest. If you slip, pause 3 s, repeat the step, and cut that part
  later; the script keeps timing simple if you just redo the whole take.

## 4. Build the finished video

```bash
# Watch the raw clip once and note the times at which each step really starts.
# Edit scripts/video/captions.txt so each caption matches your clip (times are RAW times).
scripts/video/build_video.sh ~/Desktop/raw.mov ~/Desktop/bitcodex-demo.mp4
```

You get a 1080p H.264 MP4 with a 3 s title card, burned-in captions that fade in and out, a
4 s end card, and **no audio track**. Captions are plain text; change any wording freely.

Need to cut dead time first (trim the start, remove a mistake)?

```bash
ffmpeg -ss 00:00:04 -to 00:03:35 -i raw.mov -c copy trimmed.mov     # trim ends
```

## 5. Final checks before you publish

- [ ] No secret on screen: no app secret, dashboard password, Google client secret or tokens.
      (The API key and client ID are public and fine.)
- [ ] The popup text is readable at 1080p.
- [ ] The video says "local test chain"; do not suggest mainnet or real money.
- [ ] Length 3:00 to 4:00.
