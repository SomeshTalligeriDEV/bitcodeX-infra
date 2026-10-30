import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Networks & testnet TAO</h1>
      <Lead>
        BitcodeX supports a local test chain and the public Bittensor testnet.
        Mainnet is disabled until the key system has an external security audit.
      </Lead>

      <table>
        <thead>
          <tr>
            <th>Network</th>
            <th>chainId</th>
            <th>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Local chain</td>
            <td>
              <code>bittensor:localnet</code>
            </td>
            <td>
              Development. Includes a built-in faucet that sends 1000 test TAO
              per request.
            </td>
          </tr>
          <tr>
            <td>Testnet</td>
            <td>
              <code>bittensor:testnet</code>
            </td>
            <td>
              Testing with real network conditions. Endpoint{" "}
              <code>wss://test.finney.opentensor.ai:443</code>.
            </td>
          </tr>
          <tr>
            <td>Mainnet</td>
            <td>
              <code>bittensor:mainnet</code>
            </td>
            <td>
              <strong>Refused</strong> by the SDK, the API and the wallet frame.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The network is detected from the chain&apos;s genesis hash and type, not
        from a name, so a mislabeled endpoint cannot trick the app into signing
        for the wrong chain.
      </p>

      <h2>Get testnet TAO</h2>
      <p>
        A new wallet starts with a zero balance. Testnet TAO has no value, but
        you need some to test transfers, staking and registration.
      </p>
      <ol>
        <li>Log in to the demo or your app and copy the wallet address.</li>
        <li>
          Request testnet TAO from the Bittensor community and send it to that
          address. The official Bittensor docs list no automatic public testnet
          faucet, so there is no button that gives TAO out of thin air. See{" "}
          <a href="https://bittensor.com/docs" target="_blank" rel="noreferrer">
            bittensor.com/docs
          </a>
          .
        </li>
        <li>
          The balance in the wallet updates by itself within one block (about 12
          seconds).
        </li>
      </ol>
      <Callout>
        Running your own faucet website? Set{" "}
        <code>NEXT_PUBLIC_TESTNET_FAUCET_URL</code> in the demo and the wallet
        shows an <strong>Open faucet</strong> button to it. On the local chain
        the built-in faucet works without any setup.
      </Callout>

      <h2>Choose the network</h2>
      <CodeBlock
        code={`// SDK
<BitcodeXProvider config={{ apiKey, sdkEndpoint, bittensor: { chainId: "bittensor:testnet" } }}>

// Demo app
NEXT_PUBLIC_BITTENSOR_CHAIN_ID=bittensor:testnet`}
      />
    </>
  );
}
