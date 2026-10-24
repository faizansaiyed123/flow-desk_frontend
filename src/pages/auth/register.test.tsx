import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { RegisterPage } from "@/pages/auth/register";
import { useAuthStore } from "@/stores/auth-store";

describe("RegisterPage", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("rejects a weak (letters-only) password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/your name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/workspace name/i), "Ada Inc");
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "ada@example.com" } });
    await user.type(screen.getByLabelText(/^password$/i), "onlyletters");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    expect(await screen.findByText(/mix of letters and numbers/i)).toBeInTheDocument();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/your name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/workspace name/i), "Ada Inc");
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "ada@example.com" } });
    await user.type(screen.getByLabelText(/^password$/i), "abc123");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("registers successfully with a valid, strong password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/your name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/workspace name/i), "Ada Inc");
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "ada@example.com" } });
    await user.type(screen.getByLabelText(/^password$/i), "supersecret123");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    await screen.findByText(/create workspace/i); // ensures render settled
    expect(useAuthStore.getState().accessToken).toBeTruthy();
  });

  it("shows a conflict error for an email that's already taken", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/your name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/workspace name/i), "Ada Inc");
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "taken@example.com" } });
    await user.type(screen.getByLabelText(/^password$/i), "supersecret123");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
