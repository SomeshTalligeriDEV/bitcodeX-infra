import auth0 from "auth0-js";

export const AUTH0_DOMAIN =
  import.meta.env.VITE_AUTH0_DOMAIN ?? "auth.bitcodex.invalid";
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
export const AUTH0_CONNECTION = "email";

let instance: auth0.WebAuth | null = null;

export function getAuth0WebAuth(): auth0.WebAuth {
  if (!instance) {
    instance = new auth0.WebAuth({
      domain: AUTH0_DOMAIN,
      clientID: AUTH0_CLIENT_ID,
      responseType: "token id_token",
      scope: "openid profile email",
    });
  }
  return instance;
}
