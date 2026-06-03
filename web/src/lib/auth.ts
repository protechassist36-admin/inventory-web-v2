import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { cookies } from "next/headers";
import { authConfig } from "../auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      businessName: string;
      businessType: string;
      trialEndDate: Date | null;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    businessId: string;
    businessName: string;
    businessType: string;
    trialEndDate: Date | null;
    role: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({ 
            where: { email },
            include: { 
              business: true,
              role: true
            }
          });
          
          if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new Error("Invalid email or password.");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            businessId: user.businessId,
            businessName: user.business.name,
            businessType: user.business.type,
            trialEndDate: user.business.trialEndDate,
            role: user.role.name,
            emailVerified: user.emailVerified,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub as string;
      if (token.businessId && session.user) session.user.businessId = token.businessId as string;
      if (token.role && session.user) session.user.role = token.role as string;
      if (token.businessType && session.user) session.user.businessType = token.businessType as string;
      if (token.trialEndDate && session.user) session.user.trialEndDate = token.trialEndDate as Date;
      return session;
    },
    async jwt({ token, user }) {
      // 1. Basic population from login
      if (user) {
        token.businessId = (user as any).businessId;
        token.role = (user as any).role;
        token.businessType = (user as any).businessType;
        token.trialEndDate = (user as any).trialEndDate;
      }

      // 2. Database-dependent impersonation logic
      const cookieStore = await cookies();
      const impersonationTargetId = cookieStore.get("impersonation_target")?.value;

      if (impersonationTargetId && token.role === "SUPERADMIN") {
        const targetUser = await prisma.user.findUnique({
          where: { id: impersonationTargetId },
          include: { business: true, role: true },
        });

        if (targetUser) {
          token.sub = targetUser.id;
          token.role = targetUser.role.name;
          token.businessId = targetUser.businessId;
        }
      }
      return token;
    },
  },
});
