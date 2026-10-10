import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
export async function GET() {
  const { user, role } = await getAdminContext();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ role });
}
