import { passwordHints, passwordScore } from "../lib/password";

describe("passwordScore", () => {
  it("scores weak password", () => {
    expect(passwordScore("abc")).toBeLessThan(2);
  });
  it("scores strong password", () => {
    expect(passwordScore("Abcdef1!")).toBeGreaterThanOrEqual(3);
  });
  it("requires symbol for highest score", () => {
    const base = "Abcdef12"; // no symbol
    const withSymbol = base + "!";
    expect(passwordScore(withSymbol)).toBeGreaterThan(passwordScore(base));
  });
});

describe("passwordHints", () => {
  it("returns hints for short password", () => {
    expect(passwordHints("abc").length).toBeGreaterThan(0);
  });
  it("no hints for strong password", () => {
    expect(passwordHints("Abcdef1!")).toHaveLength(0);
  });
});
