import { passwordHints, passwordScore } from "../lib/password";

describe("passwordScore", () => {
  it("scores weak password", () => {
    expect(passwordScore("abc")).toBeLessThan(2);
  });
  it("scores strong password", () => {
    expect(passwordScore("Abcdef1!")).toBeGreaterThanOrEqual(3);
  });
});

describe("passwordHints", () => {
  it("returns hints for short password", () => {
    expect(passwordHints("abc").length).toBeGreaterThan(0);
  });
});
