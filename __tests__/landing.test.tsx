import React from "react";
import * as RN from "react-native";
import renderer, { act } from "react-test-renderer";
import Landing from "../app/index";

// Mock auth context pour forcer état non connecté
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
  Redirect: () => null,
}));

describe("Landing page", () => {
  beforeAll(() => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("light");
  });
  it("renders without crash", () => {
    act(() => {
      renderer.create(<Landing />);
    });
  });
});
