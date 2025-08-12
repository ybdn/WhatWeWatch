import { mapAuthError } from "../lib/errorMapping";

describe("mapAuthError", () => {
  it("maps invalid login", () => {
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "Identifiants invalides"
    );
  });
  it("maps email not confirmed", () => {
    expect(mapAuthError({ message: "Email not confirmed" })).toBe(
      "Email non confirmé"
    );
  });
  it("maps already registered", () => {
    expect(mapAuthError({ message: "User already exists" })).toBe(
      "Email déjà enregistré"
    );
  });
  it("maps password error", () => {
    expect(mapAuthError({ message: "Password invalid" })).toBe(
      "Mot de passe invalide"
    );
  });
  it("maps rate limit", () => {
    expect(mapAuthError({ message: "Rate limit exceeded" })).toBe(
      "Trop de tentatives, réessaie plus tard"
    );
  });
  it("passes through unknown", () => {
    expect(mapAuthError({ message: "Some random error" })).toBe(
      "Some random error"
    );
  });
});
