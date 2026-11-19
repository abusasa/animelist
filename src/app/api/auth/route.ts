import { NextResponse } from "next/server";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!verifyPassword(password)) {
      return NextResponse.json({ ok: false, error: "Неверный пароль" }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Ошибка запроса" }, { status: 400 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
