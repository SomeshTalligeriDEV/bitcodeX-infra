import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Security model</h1>
      <Lead>
        What protects your users&apos; funds, and what does not. Read this
        before you ship.
      </Lead>

      <h2>The key is never in one place</h2>
      <p>
        The user&apos;s coldkey is a threshold Ed25519 key split 2-of-2 between
        the browser and the BitcodeX server. A signature needs both sides. The
        full private key is not rebuilt for signing, so a breach of the server
        alone, or of the browser alone, cannot move funds.
      </p>
      <p>
        The server&apos;s share is itself spread across independent{" "}
        <strong>key share nodes</strong> that you run. The user&apos;s share is
        recoverable from them after they log in again.
      </p>

      <h2>Only the wallet frame signs</h2>
      <ul>
        <li>
          The wallet runs in a sandboxed iframe on its own origin. Your app
          cannot read the key share in it.
        </li>
        <li>
          Every signature shows a confirmation popup first: the action in plain
          English, the amount, the destination and the fee. Unknown or unusual
          calls get a red warning.
        </li>
        <li>
          The frame answers only to sites on your allowed-origins list. Anything
          else is refused.
        </li>
      </ul>

      <h2>Exporting the key</h2>
      <p>
        A user can export their seed (and a keystore file) to move to another
        wallet. This is the one time the full key exists, and it happens only
        inside the iframe, after the user logs in again, and is never sent over
        the network.
      </p>

      <h2>Your side of it</h2>
      <ul>
        <li>
          <strong>Verify tokens on the server.</strong> Never trust a user ID
          from the browser.
        </li>
        <li>
          <strong>Keep the app secret server-side.</strong> Only the API key is
          public.
        </li>
        <li>
          <strong>List only your own origins.</strong> Never leave the list open
          in production.
        </li>
        <li>
          <strong>Back up the key share encryption secret.</strong> Losing it
          makes stored key shares unreadable.
        </li>
      </ul>

      <h2>Mainnet</h2>
      <Callout kind="warn">
        Mainnet is turned off in the SDK, the API and the wallet frame until an
        independent security audit, and a distributed key generation ceremony
        for the server share, are done. Do not put real funds at risk with this
        software before then.
      </Callout>

      <h2>Preview features</h2>
      <ul>
        <li>
          <strong>Two-factor code before large spends</strong> (preview): the
          signing popup asks for a code when a call moves at least the
          user&apos;s limit. The server&apos;s co-signing step does not check it
          yet.
        </li>
        <li>
          <strong>Agent daily limit</strong> (preview): enforced by the
          agent&apos;s server, not by the chain.
        </li>
      </ul>
    </>
  );
}
