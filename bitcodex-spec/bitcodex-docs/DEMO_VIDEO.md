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

## 2. How the video is made (three parts)

| Part | Who | What it shows | Length |
|---|---|---|---|
| 1. Intro | **automatic** (`record_public.mjs`) | Title, then the customizable login window on the live site | 31 s |
| 2. Logged-in features | **you record** | Google login, wallet, faucet, send, sign, stake, hotkeys, permissions | about 2:20 |
| 3. Docs and end | **automatic** | The documentation tour and the end card | 38 s |

Parts 1 and 3 are already built (real clicks on https://bitcodex-demo.vercel.app, only a drawn
cursor added) in `~/Desktop/BitcodeX-demo-video/`. To re-record them (after a site change):

```bash
mkdir ~/vrec && cd ~/vrec && npm init -y && npm i playwright && npx playwright install chromium
cp <repo>/scripts/video/record_public.mjs . && node record_public.mjs https://bitcodex-demo.vercel.app out
# then see "Build" below; captions_public.txt is generated from out/marks.json
```

## 3. Your part: shot list (about 2:20, start the recording just before the Google click)

Use the local stack from the pre-flight. Move the mouse slowly and pause about 1 s after each result.

| Time | Where | What you do |
|---|---|---|
| 0:00 | `localhost:3200` | Click **Google**, pick the test account, wait for the popup to close. |
| 0:10 | Account card | Show the address starting with **5**. Click **Copy**, then **Receive** (QR), then hide it. |
| 0:22 | Account card | Balance is 0. Click **Get 1000 test TAO** and watch the balance change. |
| 0:36 | **Send TAO** | Paste the RECIPIENT address, enter `1`, click **Show code** (2 s), then **Send**. In the popup read the amount, destination and fee, then **Approve**. |
| 0:54 | Result and **Activity** | Show the tx hash and the new Activity row. |
| 1:06 | **Sign and verify** | Type a message, **Sign**, show **Verified**. |
| 1:22 | **Stake** | Subnet 2, amount `5`, show the quote and slippage, **Stake**, approve. |
| 1:42 | **Your stake** | Show the position and the changed balance. |
| 1:58 | **Hotkeys** | Paste the HOTKEY address, **Add**. Pick subnet 2, show the cost, **Register**, approve, show the UID. |
| 2:18 | **Agent permissions** | Grant `SmallTransfer`, show it listed, then **Revoke**. Stop recording. |

Record with **⇧⌘5** (Record Selected Portion over the browser, no microphone, show mouse clicks).
The browser window must be 16:9 (for example 1600×900).

## 4. Build

```bash
cd <repo>
# Your part: no title or end card; captions from captions_login_part.txt (edit the times to your take)
CAPTIONS=captions_login_part.txt TITLE_SECS=0 END_SECS=0 \
  scripts/video/build_video.sh ~/Desktop/my_raw.mov ~/Desktop/BitcodeX-demo-video/part2_login.mp4

# Join all three into the final video
scripts/video/assemble.sh ~/Desktop/BitcodeX-demo-video/BitcodeX-demo.mp4 \
  ~/Desktop/BitcodeX-demo-video/part1_intro.mp4 \
  ~/Desktop/BitcodeX-demo-video/part2_login.mp4 \
  ~/Desktop/BitcodeX-demo-video/part3_docs.mp4
```

The result is 1080p H.264, silent, about 3:30. Trim dead time first if needed:
`TRIM_START=2.5 TRIM_END=150 ...` (raw seconds) in front of the build command.

## 5. Final checks before you publish

- [ ] No secret on screen: no app secret, dashboard password, Google client secret or tokens.
      (The API key and client ID are public and fine.)
- [ ] The popup text is readable at 1080p.
- [ ] The video says "local test chain"; do not suggest mainnet or real money.
- [ ] Length 3:00 to 4:00.
