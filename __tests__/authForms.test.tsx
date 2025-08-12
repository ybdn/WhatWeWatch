import React from "react";
import renderer from "react-test-renderer";
import LoginScreen from "../app/(auth)/login";
import RegisterScreen from "../app/(auth)/register";
import { emailRegex, passwordScore } from "../lib/password";

// Mocks context providers minimalistes
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn().mockResolvedValue(undefined),
    signInWithApple: jest.fn().mockResolvedValue(undefined),
    user: null,
    loading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock("../context/ToastContext", () => ({
  useToast: () => ({ show: jest.fn() }),
  ToastProvider: ({ children }: any) => children,
}));

describe("passwordScore", () => {
  it("scores weak password low", () => {
    expect(passwordScore("a")).toBeLessThan(2);
  });
  it("scores strong password high", () => {
    expect(passwordScore("Abcdef1!")).toBeGreaterThanOrEqual(3);
  });
});

describe("emailRegex", () => {
  it("accepts valid email", () => {
    expect(emailRegex.test("user@example.com")).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(emailRegex.test("bad@@example")).toBe(false);
  });
});

describe("Auth forms render", () => {
  it("renders login without crash", () => {
    renderer.create(<LoginScreen />);
  });
  it("renders register without crash", () => {
    renderer.create(<RegisterScreen />);
  });
});
