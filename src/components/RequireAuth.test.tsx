import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireAuth from "./RequireAuth";

const authState = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState.value }));

function renderGuard(roles?: ("admin" | "citizen")[]) {
  return render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route path="/auth" element={<div>login page</div>} />
        <Route path="/secret" element={<RequireAuth roles={roles}><div>secret content</div></RequireAuth>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => { authState.value = { user: null, role: null, loading: false }; });

  it("shows a spinner while the session is loading", () => {
    authState.value = { user: null, role: null, loading: true };
    renderGuard();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("redirects anonymous visitors to /auth", () => {
    renderGuard();
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders children for a signed-in user", () => {
    authState.value = { user: { id: "u1" }, role: "citizen", loading: false };
    renderGuard();
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });

  it("denies a citizen on an admin-only route", () => {
    authState.value = { user: { id: "u1" }, role: "citizen", loading: false };
    renderGuard(["admin"]);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("waits for the role before deciding on a role-restricted route", () => {
    authState.value = { user: { id: "u1" }, role: null, loading: false };
    renderGuard(["admin"]);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("allows an admin", () => {
    authState.value = { user: { id: "a1" }, role: "admin", loading: false };
    renderGuard(["admin"]);
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });
});
