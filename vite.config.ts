// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";

export default function config(configEnv: ConfigEnv) {
  const env = loadEnv(configEnv.mode, process.cwd(), "");
  // Dashboard variables must win even when .env uses a different supported alias.
  const publicEnv = (...names: string[]) =>
    names.map((name) => process.env[name]).find(Boolean) ||
    names.map((name) => env[name]).find(Boolean) ||
    "";
  const supabaseUrl = publicEnv("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const supabasePublicKey = publicEnv(
    "VITE_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
  );

  return defineConfig({
    // Emit Vercel Build Output API artifacts, including the SSR function.
    nitro: { preset: "vercel" },
    vite: {
      define: {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublicKey),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabasePublicKey),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublicKey),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(supabasePublicKey),
      },
    },
    tanstackStart: {
      server: { entry: "server" },
    },
  })(configEnv);
}
