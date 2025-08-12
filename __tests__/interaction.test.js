/* eslint-env jest */
/* globals jest, describe, test, expect */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PasswordField } from '../components/PasswordField';
import RegisterScreen from '../app/(auth)/register';
import { emailRegex, passwordHints } from '../lib/password';

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

jest.mock('../theme/colors', () => ({
  getTheme: () => ({
    colors: {
      background: '#000', text: '#fff', cardBorder: '#333', tabBarInactive: '#777'
    }
  })
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' }
}));

jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  Redirect: () => null,
}));

jest.mock('../i18n/strings', () => ({
  tAuth: (k) => k,
}));

describe('Email regex', () => {
  test('detects invalid email', () => {
    expect(emailRegex.test('bad')).toBe(false);
    expect(emailRegex.test('user@example.com')).toBe(true);
  });
});

describe('PasswordField toggle', () => {
  test('toggles visibility label', () => {
    render(<PasswordField value="abc" onChangeText={() => {}} />);
    expect(screen.getByText('passwordShow')).toBeTruthy();
    fireEvent.press(screen.getByText('passwordShow'));
    expect(screen.getByText('passwordHide')).toBeTruthy();
  });
});

describe('RegisterScreen email error', () => {
  test('shows invalid email format text when email malformed and password entered', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    const emailInput = getByPlaceholderText('emailPlaceholder');
    fireEvent.changeText(emailInput, 'invalid');
    fireEvent.press(screen.getByText('passwordShow'));
    const passwordField = getByPlaceholderText('passwordPlaceholderRegister');
    fireEvent.changeText(passwordField, 'Abcdefg1!');
    expect(getByText('invalidEmailFormat')).toBeTruthy();
  });
});

describe('Password hints', () => {
  test('returns expected missing categories', () => {
    const hints = passwordHints('abc');
    expect(hints).toEqual(expect.arrayContaining(['Au moins 8 caractères', 'Un chiffre', 'Majuscule et minuscule', 'Un symbole']));
  });
});
