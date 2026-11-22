import { createFileRoute, redirect } from "@tanstack/react-router";

/** The operations console now lives at /admin. */
export const Route = createFileRoute("/adminlogin")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
