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
  },
};
