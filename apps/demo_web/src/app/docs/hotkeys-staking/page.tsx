import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Hotkeys, staking, permissions</h1>
      <Lead>
        Bittensor has two kinds of keys. BitcodeX manages the first one for your
        users and keeps the second one where it belongs.
      </Lead>

      <h2>Coldkey and hotkey</h2>
      <table>
        <tbody>
          <tr>
            <td>Coldkey</td>
            <td>
              Holds the funds and owns the stake. This is the embedded wallet
              BitcodeX creates when a user logs in. It is split between the
              user&apos;s browser and the server.
            </td>
          </tr>
          <tr>
            <td>Hotkey</td>
            <td>
              Signs mining or validating work for one coldkey. It lives on the
              machine that runs the miner or validator, so BitcodeX{" "}
              <strong>never creates hotkeys</strong>. Users create them with{" "}
              <code>btcli</code> and add the public address.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Work with hotkeys</h2>
      <CodeBlock
        code={`// 1. On the miner or validator machine:
//    btcli wallet new-hotkey -w my_coldkey -H my_hotkey
//    btcli wallet show        # copy the hotkey address

// 2. In your app: see what this coldkey owns, read live from the chain
const hotkeys = await bittensorWallet.getHotkeys();

// 3. Register a hotkey on a subnet. The cost drops every block:
const quote = await bittensorWallet.quoteRegistration(2);
const res = await bittensorWallet.registerHotkey({ netuid: 2, hotkey: "5Hot…" });
// res.charged is what was actually paid; res.quotedMax is the most the user saw`}
      />
      <p>
        The user is never charged more than the maximum they approved, because
        the SDK registers with a limit.
      </p>

      <h2>Staking</h2>
      <CodeBlock
        code={`const quote = await bittensorWallet.quoteStake({ netuid: 2, amountTao: "5" });
await bittensorWallet.stake({ netuid: 2, hotkey: "5Val…", amountTao: "5" });
const positions = await bittensorWallet.getStakes();`}
      />

      <h2>Permissions for apps and AI agents</h2>
      <p>
        Instead of handing an app the user&apos;s key, the user grants it a{" "}
        <strong>proxy</strong>: Bittensor&apos;s built-in, on-chain permission.
        The chain enforces what the proxy may do, and the user can revoke it any
        time.
      </p>
      <CodeBlock
        code={`await bittensorWallet.grantProxy({ delegate: "5Agent…", proxyType: "SmallTransfer" });
const { delegations, deposit } = await bittensorWallet.getProxies();
await bittensorWallet.revokeProxy({ delegate: "5Agent…", proxyType: "SmallTransfer" });`}
      />
      <Callout>
        Proxy types come from the chain&apos;s own metadata, so the list is
        always current. <code>SmallTransfer</code> allows transfers under 0.5
        TAO. A daily spending limit for an agent is a <strong>preview</strong>:
        it is enforced by the agent&apos;s server, not by the chain.
      </Callout>
    </>
  );
}
