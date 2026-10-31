import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { LoginPage } from "@/pages/auth/login";
import { useAuthStore } from "@/stores/auth-store";

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    // fireEvent.change (rather than user.type) because jsdom's <input
    // type="email"> rejects malformed strings during keystroke-by-keystroke
    // simulation, which isn't how real browsers behave — this only affects
    // the test harness, not the app itself.
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "not-an-email" },
    });
    await user.type(screen.getByLabelText(/password/i), "somepassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("shows a validation error when password is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
  });

  it("logs in successfully and stores tokens", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeTruthy();
    });
  });

  it("shows the server's error message on invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("has a link to the register page", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
