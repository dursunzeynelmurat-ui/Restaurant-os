import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/permissions";
import type { UserRole } from "@/types";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const home = ROLE_HOME[session.user.role as UserRole] ?? "/login";
  redirect(home);
}
