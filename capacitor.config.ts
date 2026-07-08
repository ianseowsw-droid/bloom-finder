import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.floristar.bloomfinder",
  appName: "Bloom Finder",
  webDir: "dist-mobile",
  backgroundColor: "#f4f7f2",
  ios: {
    contentInset: "automatic",
  },
};

export default config;
