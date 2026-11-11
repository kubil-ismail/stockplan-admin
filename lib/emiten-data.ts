// Logos shipped in public/logos/emiten (the API returns the same /logos/emiten/<file> paths in `logoUrl`).
// shortcut: only the theme builder's sample pool uses this lookup; drop it when that pool comes from the API.
const LOGO: Record<string, string> = { UNTR: "untr.svg", BUMI: "bumi.png", ITMG: "itmg.svg", PTBA: "ptba.svg", AADI: "aadi.svg", INDY: "indy.svg", ADMR: "admr.svg" };
export const logoOf = (code: string) => (LOGO[code] ? `/logos/emiten/logo-${LOGO[code]}` : "");
