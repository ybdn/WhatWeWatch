import React from "react";
import renderer, { act } from "react-test-renderer";
import HomeScreen from "../app/(tabs)/index";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "user@example.com" },
    profile: { display_name: "User", id: "p1", user_id: "u1" },
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
}));

describe("HomeScreen", () => {
  it("renders", () => {
    act(() => {
      renderer.create(<HomeScreen />);
    });
  });
});
