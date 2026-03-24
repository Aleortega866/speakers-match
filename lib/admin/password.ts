import { scryptSync, timingSafeEqual } from "crypto";

/**
 * Verifica contraseña contra hash guardado por seed (formato scrypt$N$r$p$salt$hash).
 */
export function verifyScryptPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltHex = parts[4];
  const expectedHex = parts[5];

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  let salt: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
  } catch {
    return false;
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }

  const derived = scryptSync(password, salt, expected.length, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  });

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
