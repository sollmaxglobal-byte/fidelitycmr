import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { opsLogin } from "@/lib/shippy.functions";

const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function OpsLoginCard({ onSignedIn }: { onSignedIn: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Manage shipments, tracking updates and site settings.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            try {
              const result = await opsLogin({ data: { email, password } });
              if (!result.ok) {
                setError(result.message);
                return;
              }
              onSignedIn(result.token);
            } catch (err) {
              setError((err as Error).message || "Could not sign in.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block text-sm text-slate-600">
            Admin email
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className={`${field} mt-1`}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className={`${field} mt-1`}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </section>
  );
}
