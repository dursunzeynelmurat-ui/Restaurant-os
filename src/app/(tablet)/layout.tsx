import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TabletHeader from "@/components/layout/TabletHeader";

export default async function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <TabletHeader user={session.user} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
