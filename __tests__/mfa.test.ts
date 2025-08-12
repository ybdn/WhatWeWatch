import {
  challengeTotpFactor,
  deleteTotpFactor,
  enrollTotpFactor,
  listFactors,
  verifyTotpFactor,
} from "../lib/mfaService";

describe("mfaService", () => {
  beforeEach(() => {
    // @ts-ignore
    global.supabase = {
      auth: {
        mfa: {
          listFactors: jest
            .fn()
            .mockResolvedValue({
              data: { totp: [{ id: "factor1" }] },
              error: null,
            }),
          enroll: jest
            .fn()
            .mockResolvedValue({
              data: { id: "factor2", secret: "SECRET", uri: "otpauth://" },
              error: null,
            }),
          challenge: jest
            .fn()
            .mockResolvedValue({ data: { id: "challenge123" }, error: null }),
          verify: jest
            .fn()
            .mockResolvedValue({ data: { verified: true }, error: null }),
          unenroll: jest.fn().mockResolvedValue({ error: null }),
        },
      },
    };
  });

  it("listFactors retourne tableau (mock)", async () => {
    const factors = await listFactors();
    expect(factors.length).toBe(1);
    expect(factors[0].id).toBe("factor1");
  });

  it("enrollTotpFactor retourne structure TOTP", async () => {
    const data: any = await enrollTotpFactor();
    // Dans notre mock on a placé secret dans root; selon vrai SDK c'est data.totp.secret
    expect(data.secret || data.totp?.secret).toBeTruthy();
  });

  it("challenge + verify flow", async () => {
    const ch: any = await challengeTotpFactor("factor1");
    expect(ch.id).toBe("challenge123");
    const v: any = await verifyTotpFactor("factor1", ch.id, "123456");
    // On s'assure que verify retourne un objet (session ou info) - ici mock 'verified'
    expect(v).toBeTruthy();
  });

  it("deleteTotpFactor appelle unenroll", async () => {
    await deleteTotpFactor("factor1");
    // @ts-ignore
    expect(global.supabase.auth.mfa.unenroll).toHaveBeenCalledWith({
      factorId: "factor1",
    });
  });
});
