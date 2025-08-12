import { deleteCurrentAccount } from "../lib/accountService";

describe("accountService", () => {
  const originalFetch = global.fetch;
  const originalEnvVal = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = "https://func.test";
    // @ts-ignore supabase minimal mock
    const mockGetUser = jest
      .fn()
      .mockResolvedValue({ data: { user: { id: "user123" } } });
    const mockGetSession = jest
      .fn()
      .mockResolvedValue({ data: { session: { access_token: "tok" } } });
    // @ts-ignore
    global.supabase = {
      auth: { getUser: mockGetUser, getSession: mockGetSession },
    };
  });
  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnvVal === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = originalEnvVal;
    }
  });

  it("deleteCurrentAccount succès", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({}),
    });
    await expect(deleteCurrentAccount()).resolves.toBe(true);
  });

  it("deleteCurrentAccount erreur", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, text: () => Promise.resolve("ERR") });
    await expect(deleteCurrentAccount()).rejects.toThrow(/Suppression échouée/);
  });
});
