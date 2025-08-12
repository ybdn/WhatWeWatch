import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PasswordField } from '../components/PasswordField';
import RegisterScreen from '../app/(auth)/register';
import { emailRegex, passwordHints } from '../lib/password';

// Minimal mocks for contexts used inside screens
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn().mockResolvedValue(undefined),
    signUp: jest.fn().mockResolvedValue(undefined),
    loading: false,
    user: null,
    signInWithGoogle: jest.fn().mockResolvedValue(undefined),
    signInWithApple: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../context/ToastContext', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

// Theme dependency
jest.mock('../theme/colors', () => ({
  getTheme: () => ({
    colors: {
      background: '#000', text: '#fff', cardBorder: '#333', tabBarInactive: '#777'
    }
  })
}));

// Haptics to no-op
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' }
}));

// Navigation components minimal stubs
jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
  Redirect: () => null,
}));

// i18n direct return
jest.mock('../i18n/strings', () => ({
  tAuth: (k: string) => k,
}));

describe('Email regex', () => {
  it('detects invalid email', () => {
    expect(emailRegex.test('bad')).toBe(false);
    expect(emailRegex.test('user@example.com')).toBe(true);
  });
});

describe('PasswordField toggle', () => {
  it('toggles visibility label', () => {
    render(<PasswordField value="abc" onChangeText={() => {}} />);
    expect(screen.getByText('passwordShow')).toBeTruthy();
    fireEvent.press(screen.getByText('passwordShow'));
    expect(screen.getByText('passwordHide')).toBeTruthy();
  });
});

describe('RegisterScreen email error', () => {
  it('shows invalid email format text when email malformed and password entered', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    const emailInput = getByPlaceholderText('emailPlaceholder');
    fireEvent.changeText(emailInput, 'invalid');
    // Enter password to satisfy conditional rendering (score calc not required for email error display)
    const toggle = getByText('passwordShow');
    fireEvent.press(toggle); // just to exercise toggle path
    const passwordField = getByPlaceholderText('passwordPlaceholderRegister');
    fireEvent.changeText(passwordField, 'Abcdefg1!');
    expect(getByText('invalidEmailFormat')).toBeTruthy();
  });
});

// Simpler separate test for hints logic without deep UI traversal

describe('Password hints', () => {
  it('returns expected missing categories', () => {
    const hints = passwordHints('abc');
    expect(hints).toEqual(expect.arrayContaining(['Au moins 8 caractères', 'Un chiffre', 'Majuscule et minuscule', 'Un symbole']));
  });
});
