"use server";

import { prisma } from "@/lib/prisma";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/mail";

export async function verifyEmail(token: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return { success: false, message: "Invalid or expired verification token." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear the token after verification
        status: "active", // Ensure the user is active
      },
    });

    return { success: true, message: "Email verified successfully! You can now log in." };
  } catch (error) {
    console.error("Verification failed:", error);
    return { success: false, message: "An error occurred during verification." };
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "No user found with that email address." };
    }

    if (user.emailVerified) {
      return { success: false, message: "Email is already verified." };
    }

    const newToken = generateVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: newToken },
    });

    await sendVerificationEmail(email, newToken);

    return { success: true, message: "A new verification link has been sent to your email." };
  } catch (error) {
    console.error("Resend failed:", error);
    return { success: false, message: "Failed to resend verification email." };
  }
}
