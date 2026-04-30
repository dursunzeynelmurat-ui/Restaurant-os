import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createServerClient } from "./supabase";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      businessId: string;
      branchId: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
    businessId: string;
    branchId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "email-password",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = createServerClient();
        const { data: user } = await db
          .from("users")
          .select("*")
          .eq("email", credentials.email as string)
          .eq("active", true)
          .single();
        if (!user || !user.password_hash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;
        const { data: branch } = await db
          .from("branches")
          .select("id")
          .eq("business_id", user.business_id)
          .single();
        if (!branch) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          role: user.role as UserRole,
          businessId: user.business_id,
          branchId: branch.id,
        };
      },
    }),
    Credentials({
      id: "pin",
      name: "PIN",
      credentials: {
        pin: { label: "PIN", type: "password" },
        branchId: { label: "Branch ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.pin || !credentials?.branchId) return null;
        const db = createServerClient();
        const { data: branch } = await db
          .from("branches")
          .select("*")
          .eq("id", credentials.branchId as string)
          .single();
        if (!branch) return null;
        const { data: user } = await db
          .from("users")
          .select("*")
          .eq("pin", credentials.pin as string)
          .eq("business_id", branch.business_id)
          .eq("active", true)
          .single();
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          role: user.role as UserRole,
          businessId: user.business_id,
          branchId: credentials.branchId as string,
        };
      },
    }),
  ],
});
