import { mapAuthError } from "../lib/errorMapping";

describe("mapAuthError", () => {
  it("maps invalid login", () => {
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "Identifiants invalides"
    );
  });
  it("passes through unknown", () => {
    expect(mapAuthError({ message: "Some random error" })).toBe(
      "Some random error"
    );
  });
});
