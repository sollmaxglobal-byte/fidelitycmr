import { createFileRoute, redirect } from "@tanstack/react-router";

// /auth is kept for backwards-compatible links; referral links go to /register.
export const Route = createFileRoute("/auth")({
  beforeLoad: ({ search }) => {
    const ref = (search as { ref?: string })?.ref;
    throw redirect({ to: ref ? "/register" : "/login", search: ref ? { ref } : undefined });
  },
  component: () => null,
});
