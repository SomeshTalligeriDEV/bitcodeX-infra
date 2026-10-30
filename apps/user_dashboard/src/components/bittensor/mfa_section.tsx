"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { formatTaoAmount, parseUnits } from "@bitcodex/sdk-bittensor";
import { QRCodeSVG } from "qrcode.react";
import { type FC, useCallback, useEffect, useState } from "react";

import styles from "./bittensor_home.module.scss";

type Action = "status" | "enroll" | "confirm" | "threshold" | "disable";

/** X12 (Preview): authenticator app codes before signing above a limit. */
export const MfaSection: FC = () => {
  const { wallet } = useBitcodeX();
  const [status, setStatus] = useState<{
    enabled: boolean;
    threshold_rao: string | null;
  } | null>(null);
  const [enroll, setEnroll] = useState<{
    secret: string;
    otpauth_uri: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [limit, setLimit] = useState("10");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const call = useCallback(
    async (action: Action, body: Record<string, unknown> = {}) => {
      if (!wallet) {
        throw new Error("not ready");
      }
      const res = await wallet.sendMsgToIframe({
        target: "bitcodex_attached",
        msg_type: "mfa",
        payload: { action, body },
      });
      if (res.msg_type !== "mfa_ack" || !res.payload.success) {
        throw new Error(
          res.msg_type === "mfa_ack" && !res.payload.success
            ? res.payload.err
            : "no reply",
        );
      }
      return res.payload.data;
    },
    [wallet],
  );

  const refresh = useCallback(() => {
    call("status")
      .then((d) =>
        setStatus(d as { enabled: boolean; threshold_rao: string | null }),
      )
      .catch(() => setStatus(null));
  }, [call]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (fn: () => Promise<string>) => {
    try {
      setMsg({ ok: true, text: await fn() });
      setCode("");
      refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <Typography size="md" weight="semibold" color="primary">
          Two-step approval
        </Typography>
        <span className={styles.badge}>Preview</span>
      </div>
      <div className={styles.muted}>
        Ask for an authenticator app code before signing anything that moves at
        least your limit. Checked by the BitcodeX signing frame; server
        co-signing does not check it yet.
      </div>
      {msg && (
        <div className={msg.ok ? styles.logOk : styles.logErr}>{msg.text}</div>
      )}

      {status?.enabled ? (
        <>
          <div>
            On. Limit:{" "}
            {status.threshold_rao === null
              ? "every signature"
              : formatTaoAmount(BigInt(status.threshold_rao))}
          </div>
          <div className={styles.row}>
            <input
              className={styles.input}
              placeholder="6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <input
              className={styles.input}
              style={{ maxWidth: 110 }}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              aria-label="Limit in TAO"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                run(async () => {
                  const p = parseUnits(limit);
                  if (!p.success) {
                    throw new Error(p.err);
                  }
                  await call("threshold", {
                    code,
                    threshold_rao: p.data.toString(),
                  });
                  return `Limit set to ${formatTaoAmount(p.data)}`;
                })
              }
            >
              Set limit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                run(async () => {
                  await call("threshold", { code, threshold_rao: null });
                  return "A code is now required for every signature";
                })
              }
            >
              Every signature
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                run(async () => {
                  await call("disable", { code });
                  return "Two-step approval is off";
                })
              }
            >
              Turn off
            </Button>
          </div>
        </>
      ) : enroll ? (
        <>
          <div className={styles.muted}>
            Scan with your authenticator app, then enter the code it shows.
          </div>
          <div className={styles.qr}>
            <QRCodeSVG value={enroll.otpauth_uri} size={160} />
          </div>
          <span className={styles.mono}>{enroll.secret}</span>
          <div className={styles.row}>
            <input
              className={styles.input}
              placeholder="6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              size="sm"
              onClick={() =>
                run(async () => {
                  await call("confirm", { code });
                  setEnroll(null);
                  return "Two-step approval is on";
                })
              }
            >
              Confirm
            </Button>
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={!status && status !== null}
          onClick={() =>
            run(async () => {
              setEnroll(
                (await call("enroll")) as {
                  secret: string;
                  otpauth_uri: string;
                },
              );
              return "Scan the QR code";
            })
          }
        >
          Set up authenticator app
        </Button>
      )}
    </section>
  );
};
