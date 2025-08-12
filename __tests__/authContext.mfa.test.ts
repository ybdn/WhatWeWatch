import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { AuthProvider, useAuth } from "../context/AuthContext";

const mfaError: any = {
  message: "MFA required",
  code: "mfa_required",
  error_description: "MFA required",
};
// @ts-ignore
global.supabase = {
  auth: {
    signInWithPassword: jest
      .fn()
      .mockResolvedValue({ error: mfaError, data: {} }),
    mfa: {
      listFactors: jest
        .fn()
        .mockResolvedValue({
          data: { totp: [{ id: "factor123" }] },
          error: null,
        }),
    },
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: () => {} } },
    })),
  },
};

function Probe() {
  const { signIn, mfaPending } = useAuth();
  React.useEffect(() => {
    signIn("user@test.com", "Password1!");
  }, [signIn]);
  return mfaPending ? "MFA" : "NONE";
}

describe("AuthContext MFA", () => {
  it("définit mfaPending quand MFA_REQUIRED", async () => {
    let root: any;
    await act(async () => {
      root = TestRenderer.create(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(Probe, null)
        )
      );
    });
    expect(root.toJSON()).toBe("MFA");
  });
});
