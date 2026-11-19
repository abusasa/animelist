import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "abusamat_admin_session";

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "1234";
}

function makeToken(secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update("abusamat-archive-v2-session")
    .digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = getSecret();
  if (!input || input.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<void> {
  const token = makeToken(getSecret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = makeToken(getSecret());
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
