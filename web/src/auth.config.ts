import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // No providers here to keep it edge-safe
  callbacks: {
    authorized() {
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub as string;
      if (token.businessId && session.user) session.user.businessId = token.businessId as string;
      if (token.role && session.user) session.user.role = token.role as string;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.businessId = (user as any).businessId;
        token.role = (user as any).role;
      }
      return token;
    },
  },
};
