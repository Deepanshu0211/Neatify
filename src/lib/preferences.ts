export type Preferences = {
  theme: "light" | "dark" | "system";
  accent: "sage" | "olive";
  tray: boolean;
  sound: boolean;
  autoOrganize: boolean;
  privateHistory: boolean;
  skipDuplicates: boolean;
  excludedFolders: string;
  excludedExtensions: string;
  extensions: string;
};
export const defaults: Preferences = {
  theme: "system",
  accent: "sage",
  tray: false,
  sound: true,
  autoOrganize: false,
  privateHistory: false,
  skipDuplicates: false,
  excludedFolders: "",
  excludedExtensions: "",
  extensions: "",
};
export function loadPreferences(): Preferences {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("neatify-preferences") || "{}"),
    };
  } catch {
    return defaults;
  }
}
export function rulesFor(p: Preferences) {
  return {
    privateHistory: p.privateHistory,
    skipDuplicates: p.skipDuplicates,
    excludedFolders: p.excludedFolders
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
    excludedExtensions: p.excludedExtensions
      .split(",")
      .map((x) => x.trim().replace(/^\./, ""))
      .filter(Boolean),
    extensions: Object.fromEntries(
      p.extensions
        .split("\n")
        .filter((x) => x.includes("="))
        .map((x) => {
          const [ext, ...rest] = x.split("=");
          return [ext.trim().replace(/^\./, ""), rest.join("=").trim()];
        }),
    ),
  };
}
