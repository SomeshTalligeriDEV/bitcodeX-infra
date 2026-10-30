import { Callout, Lead, Pill } from "@bitcodex-demo-web/components/docs/parts";

type Kind = "real" | "preview" | "no";
const rows: [string, Kind, string, string][] = [
  [
    "Embedded coldkey (2-of-2), signing accepted by the chain",
    "real",
    "Real",
    "Proven on a local chain with a real transfer.",
  ],
  [
    "Signing popup with plain-English cards and fee",
    "real",
    "Real",
    "Fee shown equals fee charged.",
  ],
  [
    "Send, stake, unstake with quotes, balances, history",
    "real",
    "Real",
    "62 local-chain tests.",
  ],
  [
    "Sign-In with Bittensor (wallet login)",
    "real",
    "Real",
    "Signature verified; replay and bad signatures rejected.",
  ],
  [
    "Hotkeys and registration at exact cost",
    "real",
    "Real",
    "Charged amount equals the prediction.",
  ],
  [
    "Export key (seed and keystore)",
    "real",
    "Real",
    "An exported key signed a transaction.",
  ],
  [
    "Permissions through proxies",
    "real",
    "Real",
    "Four on-chain acceptance tests.",
  ],
  [
    "Access tokens and the server package",
    "real",
    "Real",
    "Tampered, wrong-app and expired tokens rejected.",
  ],
  [
    "Developer dashboard (apps, API key, secret, origins)",
    "real",
    "Real",
    "Tested end to end over HTTP.",
  ],
  ["Local-chain faucet", "real", "Real", "Local chain only."],
  [
    "Testnet",
    "real",
    "Real (read and signature check)",
    "A funded testnet transfer needs testnet TAO.",
  ],
  ["Hotkey swap", "preview", "Preview", "Local chain only."],
  ["Coldkey swap", "preview", "Preview", "Explanation only, no action."],
  [
    "Subtensor EVM address",
    "preview",
    "Preview",
    "Mapping verified; signing from the EVM side is coming.",
  ],
  [
    "Two-factor code before large spends",
    "preview",
    "Preview",
    "Server co-signing does not check it yet.",
  ],
  [
    "Agent daily limit",
    "preview",
    "Preview",
    "Enforced by the agent server, not the chain.",
  ],
  ["Email login, passkey login", "no", "Not built", ""],
  [
    "Wallet button inside the BitcodeX popup",
    "no",
    "Not built",
    "The SDK call exists; the built-in button does not.",
  ],
  ["Mainnet", "no", "Off by design", "Needs a key ceremony and an audit."],
];

export default function Page() {
  return (
    <>
      <h1>Status: what is real</h1>
      <Lead>
        Nothing in BitcodeX is simulated. Everything here either works against a
        real chain, or is labelled.
      </Lead>
      <Callout kind="warn">
        Everything marked Real has passed automated tests against a chain or the
        API. A full run in a browser with real logins is still being completed,
        so treat BitcodeX as an early release for testnet.
      </Callout>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([f, k, label, note]) => (
            <tr key={f}>
              <td>{f}</td>
              <td>
                <Pill kind={k}>{label}</Pill>
              </td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>Packages:</strong> the npm packages are built and tested but not
        published yet. <strong>Licence:</strong> not chosen yet.
      </p>
    </>
  );
}
