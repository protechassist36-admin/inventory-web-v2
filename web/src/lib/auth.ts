import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { cookies } from "next/headers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      businessName: string;
      businessType: string;
      trialEndDate: string | null;
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
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub as string;
      }
      if (token.businessId && session.user) {
        session.user.businessId = token.businessId as string;
      }
      if (token.businessType && session.user) {
        session.user.businessType = token.businessType as string;
      }
      if (token.trialEndDate && session.user) {
        session.user.trialEndDate = token.trialEndDate as string;
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }
      if (token.impersonatedBy && session.user) {
        (session as any).impersonated = true;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log("DEBUG: JWT callback - processing new user:", user.email, "role:", user.role);
        token.businessId = user.businessId;
        token.businessName = user.businessName;
        token.businessType = user.businessType;
        token.trialEndDate = user.trialEndDate?.toISOString();
        token.role = user.role;
      } else {
        console.log("DEBUG: JWT callback - existing session, current token role:", token.role);
      }

      const cookieStore = await cookies();
      const impersonationTargetId = cookieStore.get("impersonation_target")?.value;

      if (impersonationTargetId && token.role === "SUPERADMIN") {
        console.log("DEBUG: JWT callback - Impersonating target:", impersonationTargetId);
        const targetUser = await prisma.user.findUnique({
          where: { id: impersonationTargetId },
          include: { 
            business: true,
            role: true
          },
        });

        if (targetUser) {
          token.sub = targetUser.id;
          token.role = targetUser.role.name;
          token.businessId = targetUser.businessId;
          token.businessName = targetUser.business.name;
          token.businessType = targetUser.business.type;
          token.impersonatedBy = "SUPERADMIN";
        }
      }
      return token;
    },
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          console.log(`DEBUG: Attempting login for email: ${email}`);
          
          const user = await prisma.user.findUnique({ 
            where: { email },
            include: { 
              business: true,
              role: true
            }
          });
          
          if (!user) {
            console.log(`DEBUG: User not found: ${email}`);
            throw new Error("Invalid email or password.");
          }

          console.log(`DEBUG: User found, comparing password for: ${email}`);
          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
          
          if (!passwordsMatch) {
            console.log(`DEBUG: Password mismatch for: ${email}`);
            throw new Error("Invalid email or password.");
          }

          console.log(`DEBUG: Login successful for: ${email}`);

          // Check for email verification
          if (user.role.name !== "SUPERADMIN" && !user.emailVerified) {
             console.log(`DEBUG: Login denied. Email not verified for: ${email}`);
             throw new Error("Please verify your email address before logging in.");
          }
          
          // Check for manual approval
          if (user.role.name !== "SUPERADMIN" && user.business.status.toLowerCase() !== "active") {
            console.log(`DEBUG: Login denied. Business status is: ${user.business.status}`);
            throw new Error("Account is pending approval. Please contact the administrator.");
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
        console.log(`DEBUG: Credential parsing failed`);
        return null;
      },
    }),
  ],
});
