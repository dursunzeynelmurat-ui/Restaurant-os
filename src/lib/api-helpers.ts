import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types";

export interface SessionContext {
  userId: string;
  branchId: string;
  businessId: string;
  role: UserRole;
  name: string;
}

type AuthResult =
  | { ok: true; ctx: SessionContext }
  | { ok: false; response: NextResponse };

export async function requireSession(
  allowedRoles?: UserRole[]
): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = session.user.role as UserRole;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden. Requires one of: ${allowedRoles.join(", ")}` },
        { status: 403 }
      ),
    };
  }

  if (!session.user.id || !session.user.branchId || !session.user.businessId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Incomplete session" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    ctx: {
      userId: session.user.id,
      branchId: session.user.branchId,
      businessId: session.user.businessId,
      role,
      name: session.user.name ?? "",
    },
  };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
