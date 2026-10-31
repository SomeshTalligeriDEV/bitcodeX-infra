#!/usr/bin/env python3
"""Build a 3-minute narrated BitcodeX architecture and feature overview.

Requires macOS `say` and ffmpeg/ffprobe. The visual feature panels are diagrams,
not captured product screens; record a signed-in session separately for a live demo.
"""

from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "bitcodex-overview.mp4"
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"

SLIDES = [
    ("BITCODEX / BITTENSOR WALLET INFRASTRUCTURE", "A wallet experience built for the\nBittensor ecosystem", "A narrated platform tour  |  Local chain + testnet preview", 45),
    ("01 / THE ONBOARDING PROBLEM", "Wallets are the front door\nto every subnet app", "BitcodeX connects familiar sign-in to a Bittensor account, so\nusers can reach staking, subnet tools, and agent experiences sooner.", 48),
    ("02 / USER EXPERIENCE", "Sign in. Review.\nApprove with context.", "Google or an existing wallet  /  Balance and activity  /  TAO\nSend, stake, hotkeys, message signing, and revocable permissions", 50),
    ("03 / SYSTEM DESIGN", "App  →  SDK  →  Wallet frame", "The frame owns approval and browser-side signing. The API\ncoordinates sessions and signing rounds with independent share nodes.", 48),
    ("04 / THRESHOLD SIGNING", "Two shares. One signature.\nThe full key is not rebuilt.", "FROST threshold Ed25519 signing combines browser and server\nparticipation to create a Bittensor-compatible signature.", 48),
    ("05 / BUILDER TOOLKIT", "A small integration surface\nfor a full wallet stack", "React provider and hooks  /  Bittensor wallet actions\nServer token verification  /  Developer app and origin controls", 48),
    ("06 / OPERATOR VIEW", "Open source. Self-hostable.\nDesigned in layers.", "Rust crypto and WASM  /  TypeScript SDKs and APIs\nKey share nodes, PostgreSQL, wallet frame, dashboards, docs", 48),
    ("07 / NETWORK STATUS", "Local chain and testnet\nare the supported targets", "Mainnet stays disabled pending an independent security audit.\nTestnet transactions require testnet TAO and funded validation.", 48),
]

def run(args):
    subprocess.run(args, check=True)

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="bitcodex-video-") as temp_name:
        temp = Path(temp_name)
        clips = []
        for i, (eyebrow, title, body, words_per_minute) in enumerate(SLIDES):
            title_file, body_file, voice_file = (temp / f"{i}-{n}.txt" for n in ("title", "body", "voice"))
            title_file.write_text(title, encoding="utf-8")
            body_file.write_text(body, encoding="utf-8")
            # 45-50 seconds is a rate, not duration; the 22.5-second panel is paced
            # with a modest reading rate and the final audio is padded to its panel.
            narration = [
                "BitcodeX is open-source wallet infrastructure for Bittensor. This short tour explains why it exists, how its layers fit together, and what users and developers can do with it.",
                "Bittensor subnets compete to provide useful digital work, and TAO connects users to that economy. But a wallet can be a hard first step: browser extensions, command-line tools, and seed phrase handling. BitcodeX gives apps an embedded onboarding path, so more people can get from an idea to a subnet experience.",
                "A user can sign in with Google or an existing Bittensor wallet, then see an address, balances, and activity. The wallet supports sending TAO, staking, hotkey registration, message signing, and on-chain proxy permissions. Before a signing action, the embedded wallet presents a confirmation for the user to review.",
                "The application integrates through the SDK. The SDK communicates with the wallet frame, which runs in its own origin and presents approvals. The frame talks to the API over HTTPS. The API coordinates identity, sessions, and signing rounds with key share nodes. Approved transactions are submitted to the selected Bittensor network.",
                "For Bittensor, BitcodeX uses FROST threshold Ed25519 signing. The browser holds one share and the server side holds another. A signing round combines their contributions without reconstructing the complete private key. The resulting signature is compatible with the network. Hotkeys remain on the miner or validator machine.",
                "Builders install the React and Bittensor SDKs, add the provider, and call wallet actions from their app. A backend can verify access tokens using the server package before trusting the user identity. The developer dashboard provides app configuration and allowed-origin controls. The repo includes API schemas and integration examples.",
                "Operators can develop locally or use the self-host setup. The monorepo layers shared libraries and types beneath cryptography, SDKs, APIs, wallet nodes, and product apps. PostgreSQL stores service state. Rust crypto is exposed to browser and server code through WASM and Node interfaces.",
                "The current supported environments are the local test chain and Bittensor testnet. Local flows have been exercised end to end. Testnet transactions need funded accounts and a funded validation run. Mainnet is disabled until an independent security audit. Explore the repository, run the local stack, and build a friendlier front door to Bittensor.",
            ][i]
            voice_file.write_text(narration, encoding="utf-8")
            audio = temp / f"{i}.wav"
            run(["say", "-v", "Alex", "-r", "174", "-o", str(temp / f"{i}.aiff"), "-f", str(voice_file)])
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(temp / f"{i}.aiff"), "-af", "apad=pad_dur=22.5,atrim=duration=22.5", "-ar", "48000", str(audio)])
            clip = temp / f"{i}.mp4"
            dur = 22.5
            # High-contrast editorial card: no simulated wallet screen or transaction state.
            vf = (
                f"drawbox=x=0:y=0:w=16:h=ih:color=0x7F56D9:t=fill,"
                f"drawbox=x=120:y=180:w=1680:h=2:color=0x333344:t=fill,"
                f"drawtext=fontfile={FONT}:text='{eyebrow}':fontcolor=0xA78BFA:fontsize=30:x=120:y=112,"
                f"drawtext=fontfile={FONT}:textfile={title_file}:fontcolor=white:fontsize=70:line_spacing=22:x=120:y=270,"
                f"drawtext=fontfile={FONT}:textfile={body_file}:fontcolor=0xD1D5DB:fontsize=34:line_spacing=18:x=120:y=590,"
                f"drawbox=x=120:y=930:w=1680:h=2:color=0x333344:t=fill,"
                f"drawtext=fontfile={FONT}:text='BITCODEX  /  SYSTEM TOUR':fontcolor=0x9CA3AF:fontsize=22:x=120:y=970,"
                f"drawtext=fontfile={FONT}:text='{i+1:02d}  /  08':fontcolor=0x9CA3AF:fontsize=22:x=1680:y=970"
            )
            run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x080A12:s=1920x1080:r=30:d={dur}", "-i", str(audio), "-vf", vf, "-t", str(dur), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", str(clip)])
            clips.append(clip)
        listing = temp / "clips.txt"
        listing.write_text("".join(f"file '{c}'\n" for c in clips), encoding="utf-8")
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", "-movflags", "+faststart", str(OUT)])
    print(f"Created {OUT}")

if __name__ == "__main__":
    main()
