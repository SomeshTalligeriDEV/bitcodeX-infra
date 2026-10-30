import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

const rows: [string, string][] = [
  ["getAddress()", "The user's SS58 address, or null when signed out."],
  [
    "getBalances()",
    "Live from the chain, in rao (1 TAO = 1,000,000,000 rao): free, reserved, frozen and transferable.",
  ],
  [
    "sendTao(to, amountTao)",
    'Transfer TAO. Amount is a decimal string, for example "0.5". Returns { txHash, blockHash }.',
  ],
  [
    "quoteStake({ netuid, amountTao })",
    "Exact price and slippage for staking into a subnet.",
  ],
  [
    "stake({ netuid, hotkey, amountTao, slippageBps?, allowPartial? })",
    "Stake TAO to a hotkey on a subnet.",
  ],
  ["quoteUnstake({ netuid, amountAlpha })", "Exact quote for unstaking."],
  [
    "unstake({ netuid, hotkey, amountAlpha, slippageBps?, allowPartial? })",
    "Unstake alpha from a hotkey.",
  ],
  ["getStakes()", "The user's stake positions across subnets."],
  ["listSubnets()", "Subnets on the connected network."],
  [
    "getHotkeys() / getHotkeyInfo(hotkey)",
    "Hotkeys owned by this coldkey, or one hotkey's owner, subnets and UIDs.",
  ],
  [
    "quoteRegistration(netuid)",
    "Current burn cost to register on a subnet. It changes every block.",
  ],
  [
    "registerHotkey({ netuid, hotkey })",
    "Register a hotkey. Returns the maximum shown and the amount actually charged.",
  ],
  [
    "swapHotkey({ hotkey, newHotkey, netuid })",
    "Preview, local chain only: swap a hotkey, with the exact cost.",
  ],
  ["getProxies()", "Permissions this user has granted."],
  [
    "grantProxy({ delegate, proxyType, delayBlocks? })",
    "Let another account act for the user within a proxy type.",
  ],
  [
    "revokeProxy({ delegate, proxyType, delayBlocks? })",
    "Take that permission back.",
  ],
  [
    "getHistory()",
    "Transactions this wallet sent, with their on-chain outcome.",
  ],
  [
    "signMessage(message)",
    "Sign a message. The popup shows the text first. Returns the signature.",
  ],
  [
    "signAndSend(extrinsic)",
    "Sign and send any polkadot.js extrinsic you built yourself.",
  ],
  [
    "api()",
    "The connected polkadot.js ApiPromise, for reads that are not wrapped here.",
  ],
  ["getEvmAccount()", "Preview: the user's Subtensor EVM address mapping."],
];

export default function Page() {
  return (
    <>
      <h1>Wallet API</h1>
      <Lead>
        <code>bittensorWallet</code> is your handle to the user&apos;s account.
        Every method that spends or signs shows the user a confirmation popup
        first.
      </Lead>

      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([m, d]) => (
            <tr key={m}>
              <td>
                <code>{m}</code>
              </td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Examples</h2>
      <CodeBlock
        title="Balance and send"
        code={`const { transferable } = await bittensorWallet.getBalances(); // bigint, in rao
const { txHash } = await bittensorWallet.sendTao("5F…", "0.25");`}
      />
      <CodeBlock
        title="Stake with a quote"
        code={`const quote = await bittensorWallet.quoteStake({ netuid: 2, amountTao: "1" });
// show quote to the user, then:
const result = await bittensorWallet.stake({
  netuid: 2,
  hotkey: "5Validator…",
  amountTao: "1",
  slippageBps: 100, // 1 %
});`}
      />
      <CodeBlock
        title="Sign a message"
        code={`const signature = await bittensorWallet.signMessage("Welcome to my app");`}
      />

      <h2>Errors</h2>
      <p>
        If the user closes the popup, the call rejects with the{" "}
        <code>USER_CANCELLED</code> value exported by{" "}
        <code>@bitcodex/sdk-bittensor</code>. Treat that as a normal outcome,
        not a failure.
      </p>
      <Callout>
        Unknown or unusual calls are shown with a red warning in the popup, so
        users see exactly when an app asks for something it should not.
      </Callout>
    </>
  );
}
