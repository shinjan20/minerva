import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET || "super_secret_jwt_key_for_development";
const key = new TextEncoder().encode(secretKey);

export type UserPayload = {
  id: string;
  email: string;
  name?: string | null;
  role: "STUDENT" | "CR" | "OFFICE_STAFF";
  section?: string | null;
  batch?: string | null;
  first_login: boolean;
};

export async function encrypt(payload: UserPayload, expiresIn: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as UserPayload;
}

export async function setCookieSession(user: UserPayload) {
  const expiresIn =
    user.role === "STUDENT"
      ? process.env.SESSION_TIMEOUT_STUDENT || "2h"
      : process.env.SESSION_TIMEOUT_ADMIN || "30m";

  const expiresNumber = user.role === "STUDENT" ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const expires = new Date(Date.now() + expiresNumber);

  const session = await encrypt(user, expiresIn);

  cookies().set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function clearSession() {
  cookies().set("session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}
