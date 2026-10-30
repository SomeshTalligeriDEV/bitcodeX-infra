import type { SignInType } from "@bitcodex-sdk-core/types/oauth";

export type SignInModalTheme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Per-app login settings from the developer dashboard (X11). */
export interface SignInModalBranding {
  /** Enabled providers in display order; unknown names are skipped. */
  loginMethods?: string[];
  /** #rrggbb */
  accentColor?: string | null;
  logoUrl?: string | null;
}

export interface SignInModalOptions {
  onSelect: (provider: SignInType) => Promise<void>;
  onClose?: () => void;
  theme?: SignInModalTheme;
  branding?: SignInModalBranding;
}

export interface ProgressState {
  status: "loading" | "failed";
  provider: SignInType;
}
