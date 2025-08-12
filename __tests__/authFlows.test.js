/* eslint-env jest */
/* globals jest, describe, test, expect, beforeEach */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "../app/(auth)/login";
import RegisterScreen from "../app/(auth)/register";
import ResetPasswordScreen from "../app/(auth)/reset-password";

// Stable mock functions (pas de réassignation, on reset seulement)
const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signIn: mockSignIn,
    resetPassword: mockResetPassword,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    loading: false,
    user: null,
  }),
}));

jest.mock("../context/ToastContext", () => ({
  useToast: () => ({ show: jest.fn() }),
}));

jest.mock("../theme/colors", () => ({
  getTheme: () => ({
    colors: {
      background: "#000",
      text: "#fff",
      cardBorder: "#333",
      tabBarInactive: "#777",
    },
  }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

jest.mock("expo-router", () => ({
  Link: ({ children }) => children,
  Redirect: () => null,
}));

jest.mock("../i18n/strings", () => ({
  tAuth: (k) => k,
}));

beforeEach(() => {
  mockSignUp.mockReset().mockResolvedValue(undefined);
  mockSignIn.mockReset();
  mockResetPassword.mockReset();
});

describe("Register button disabled logic", () => {
  test("prevents submission with weak password then allows with strong password", async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText("emailPlaceholder"),
      "user@example.com"
    );
    fireEvent.press(screen.getByText("passwordShow"));
    fireEvent.changeText(
      screen.getByPlaceholderText("passwordPlaceholderRegister"),
      "abc"
    ); // weak
    fireEvent.press(screen.getByText("registerButton"));
    expect(mockSignUp).not.toHaveBeenCalled();
    fireEvent.changeText(
      screen.getByPlaceholderText("passwordPlaceholderRegister"),
      "Abcdefg1!"
    ); // strong
    fireEvent.press(screen.getByText("registerButton"));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
  });
});

describe("Login invalid credentials path", () => {
  test("shows invalidCredentials on signIn rejection", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("fail"));
    render(<LoginScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText("emailPlaceholder"),
      "user@example.com"
    );
    fireEvent.press(screen.getByText("passwordShow"));
    fireEvent.changeText(
      screen.getByPlaceholderText("passwordPlaceholder"),
      "Abcdefg1!"
    );
    fireEvent.press(screen.getByText("loginButton"));
    await waitFor(() =>
      expect(screen.getByText("invalidCredentials")).toBeTruthy()
    );
  });
});

describe("Reset password flow", () => {
  test("pending then done state", async () => {
    let resolver;
    mockResetPassword.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolver = r;
        })
    );
    render(<ResetPasswordScreen />);
    const emailInput = screen.getByPlaceholderText("emailPlaceholder");
    fireEvent.changeText(emailInput, "user@example.com");
    fireEvent.press(screen.getByText("sendLink"));
    expect(screen.getByText("sendLinkPending")).toBeTruthy();
    await act(async () => {
      resolver();
    });
    // Après résolution: le bouton n'est plus présent (on affiche resetDone bloc)
    await waitFor(() => expect(screen.queryByText("sendLink")).toBeNull());
    // Le texte final combine resetDone et returnLogin, on utilise une regex partielle
    await waitFor(() => expect(screen.getByText(/resetDone/)).toBeTruthy());
  });
});
