import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

// Edge-safe config — no bcrypt, no Node.js-only modules
// Used by middleware for session validation
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.businessId = user.businessId as string;
        token.branchId = user.branchId as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.businessId = token.businessId as string;
        session.user.branchId = token.branchId as string;
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
};
