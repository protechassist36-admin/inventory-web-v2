"use server";

import { auth } from "@/lib/auth";

export async function createPaymentSession(planName: string, amount: number) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  // In production, this calls Flutterwave API to create a payment link
  const txRef = `tx_${Date.now()}`;
  
  // Return the checkout URL or transaction data
  return {
    success: true,
    txRef,
    // Redirect URL to Flutterwave or hosted checkout page
    checkoutUrl: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${txRef}&amount=${amount}&currency=SLL&customer[email]=${session.user.email}&meta[businessId]=${session.user.businessId}&meta[plan]=${planName}`
  };
}
