import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Self-host & deploy</h1>
      <Lead>
        BitcodeX is open source and you run it yourself. Your users&apos; key
        shares live on servers you control.
      </Lead>

      <h2>What runs</h2>
      <table>
        <tbody>
          <tr>
            <td>API</td>
            <td>
              Sign-in, session, threshold signing, access tokens, developer
              apps.
            </td>
          </tr>
          <tr>
            <td>Two key share nodes</td>
            <td>
              Each stores one share of recovery data and takes part in signing.
              Two are required: any one alone can do nothing.
            </td>
          </tr>
          <tr>
            <td>Wallet frame</td>
            <td>
              Static site that runs in an iframe inside your app and holds the
              user&apos;s share.
            </td>
          </tr>
          <tr>
            <td>PostgreSQL</td>
            <td>
              One server with three databases: API and one per key share node.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Option A: one machine with Docker</h2>
      <CodeBlock
        lang="bash"
        code={`git clone <your-fork> bitcodex && cd bitcodex
./selfhost/setup.sh      # generates secrets, builds images, starts, bootstraps
# prints your API key, app secret and dashboard login ONCE: save them`}
      />
      <p>
        <code>selfhost/setup.sh</code> creates every secret, starts Postgres,
        the API, both key share nodes and the wallet frame, and creates your
        first app on testnet.
      </p>

      <h2>Option B: Render (free to try)</h2>
      <ol>
        <li>
          GitHub Actions builds the images and pushes them to a private
          registry.
        </li>
        <li>
          Create a Render Blueprint from <code>render.yaml</code>. It defines
          the API, both key share nodes, the wallet frame and the database.
        </li>
        <li>
          Add a registry credential in Render, a secret file with the key share
          encryption secret, and your Google client ID.
        </li>
        <li>
          Run <code>scripts/render_bootstrap.sh</code> once to register the
          nodes and create your first app.
        </li>
      </ol>
      <Callout kind="warn">
        On Render&apos;s free plan, services sleep after 15 minutes without
        traffic (the first request then takes about a minute) and the free
        database expires after 30 days. Use paid instances for real users.
      </Callout>

      <h2>Google login</h2>
      <p>
        In Google Cloud Console, create a Web OAuth client and add, on the{" "}
        <strong>wallet frame&apos;s</strong> address:
      </p>
      <ul>
        <li>
          Authorized JavaScript origin:{" "}
          <code>https://wallet.your-domain.com</code>
        </li>
        <li>
          Authorized redirect URI:{" "}
          <code>https://wallet.your-domain.com/google/callback</code>
        </li>
      </ul>
      <p>
        While the consent screen is in Testing, only addresses listed under{" "}
        <strong>Test users</strong> can sign in.
      </p>

      <h2>Allowed origins</h2>
      <p>
        The wallet frame only talks to sites you list. Add each site&apos;s
        address to the app&apos;s allowed origins and to the frame&apos;s build
        setting, or the login window will refuse to open.
      </p>
    </>
  );
}
