import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WebSidebar from "@/components/layout/WebSidebar";

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["OWNER", "MANAGER"].includes(session.user.role)) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-100">
      <WebSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
