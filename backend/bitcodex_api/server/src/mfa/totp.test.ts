import { base32Decode, base32Encode, hotp, totp, verifyTotp } from "./totp";

// RFC 6238 Appendix B (SHA1, secret "12345678901234567890", 8 digits).
const SECRET = Buffer.from("12345678901234567890");

describe("TOTP", () => {
  it("matches RFC 6238 test vectors", () => {
    expect(totp(SECRET, 59, 8)).toBe("94287082");
    expect(totp(SECRET, 1111111109, 8)).toBe("07081804");
    expect(totp(SECRET, 1234567890, 8)).toBe("89005924");
    expect(totp(SECRET, 2000000000, 8)).toBe("69279037");
  });

  it("matches RFC 4226 HOTP vectors", () => {
    expect(hotp(SECRET, 0)).toBe("755224");
    expect(hotp(SECRET, 9)).toBe("520489");
  });

  it("base32 round-trips (RFC 4648)", () => {
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
    expect(base32Decode("MZXW6YTBOI").toString()).toBe("foobar");
  });

  it("accepts ±1 step and rejects others and junk", () => {
    const t = 1_800_000_000;
    expect(verifyTotp(SECRET, totp(SECRET, t), t)).toBe(true);
    expect(verifyTotp(SECRET, totp(SECRET, t - 30), t)).toBe(true);
    expect(verifyTotp(SECRET, totp(SECRET, t - 90), t)).toBe(false);
    expect(verifyTotp(SECRET, "12345", t)).toBe(false);
    expect(verifyTotp(SECRET, "abcdef", t)).toBe(false);
  });
});
