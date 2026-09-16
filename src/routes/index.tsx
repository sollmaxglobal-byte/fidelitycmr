import { createFileRoute, redirect } from "@tanstack/react-router";

// Home page disabled — users start at /auth (login / register / forgot password).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
