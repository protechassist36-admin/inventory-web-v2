import { NextResponse } from 'next/server';
import { getTenantPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const signature = req.headers.get("verif-hash");

  // In production, ALWAYS verify the signature!
  if (signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  if (body.event === "charge.completed") {
    const { tx_ref, amount, meta } = body.data;
    
    // Update business plan in DB
    const prisma = getTenantPrisma(meta.businessId);
    await prisma.business.update({
      where: { id: meta.businessId },
      data: {
        subscriptionStatus: "ACTIVE",
        flutterwaveRef: tx_ref
      }
    });
  }

  return NextResponse.json({ received: true });
}
