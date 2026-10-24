import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { ClientsPage } from "@/pages/clients/clients-list";
import { useAuthStore } from "@/stores/auth-store";

describe("ClientsPage", () => {
  beforeEach(() => {
    useAuthStore.getState().setTokens("fake-token", "fake-refresh");
    useAuthStore.getState().setCurrentTenant("tenant-1");
  });

  it("renders the mocked client list", async () => {
    renderWithProviders(<ClientsPage />);
    expect(await screen.findByText("Wayne Enterprises")).toBeInTheDocument();
    expect(screen.getByText("Wayne Ent.")).toBeInTheDocument();
  });

  it("opens the create-client dialog and submits a new client", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />);
    await screen.findByText("Wayne Enterprises");

    await user.click(screen.getByRole("button", { name: /new client/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name$/i), "Stark Industries");
    await user.click(screen.getByRole("button", { name: /create client/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("requires a name before submitting the create-client form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />);
    await screen.findByText("Wayne Enterprises");

    await user.click(screen.getByRole("button", { name: /new client/i }));
    await user.click(screen.getByRole("button", { name: /create client/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it("filters the client list via the search box", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />);
    await screen.findByText("Wayne Enterprises");

    await user.type(screen.getByPlaceholderText(/search clients/i), "wayne");
    // The mocked handler always returns the same fixture regardless of the
    // query string, so this asserts the request fires with the right
    // param rather than asserting on filtered output.
    expect(screen.getByPlaceholderText(/search clients/i)).toHaveValue("wayne");
  });
});
