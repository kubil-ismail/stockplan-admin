import { SESSION_FLAG } from "./admin-gate";

// Session cookie (no max-age), like the backend's `asid`: both go away when the browser closes.
const attrs = () => `path=/admin; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
export const markSignedIn = () => { document.cookie = `${SESSION_FLAG}=1; ${attrs()}`; };
export const markSignedOut = () => { document.cookie = `${SESSION_FLAG}=; max-age=0; ${attrs()}`; };
