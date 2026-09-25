/**
 * Sign-in providers shown on the login page.
 * - "google" uses Better Auth native Google OAuth (needs GOOGLE_CLIENT_ID / SECRET)
 * - Grok broker providers kept for compatibility but won't work on self-hosted.
 */

export type SocialProvider = {
  providerId: string;
  label: string;
  /** true = native Better Auth socialProviders (google, github, ...) */
  native?: boolean;
};

/** Providers rendered as buttons on /login */
export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [
  { providerId: "google", label: "Google", native: true },
];

/** @deprecated kept so old broker code still type-checks */
export type GrokProvider = {
  providerId: string;
  idp: string;
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];
