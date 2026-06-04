"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { BusinessType } from "@prisma/client";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/mail";

export async function registerBusiness(data: any) {
  const { businessName, email, password, businessType, plan } = data;

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = generateVerificationToken();

  // Use a transaction to create both
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Business with 14-day trial
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const business = await tx.business.create({
      data: {
        name: businessName,
        slug: businessName.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(7),
        type: businessType as BusinessType,
        plan: plan,
        status: "PENDING",
        enabledModules: ["POS", "INVENTORY"],
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
      },
    });

    // 2. Create Default roles for the business
    const [adminRole, managerRole, employeeRole] = await Promise.all([
      tx.role.create({ data: { name: 'ADMIN', businessId: business.id } }),
      tx.role.create({ data: { name: 'MANAGER', businessId: business.id } }),
      tx.role.create({ data: { name: 'EMPLOYEE', businessId: business.id } }),
    ]);

    // 3. Create Admin User with verification token
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name: "Admin",
        roleId: adminRole.id,
        businessId: business.id,
        verificationToken,
      },
    });

    return { 
      business: {
        ...business,
        createdAt: business.createdAt.toISOString(),
        updatedAt: business.updatedAt.toISOString(),
        trialStartDate: business.trialStartDate?.toISOString() || null,
        trialEndDate: business.trialEndDate?.toISOString() || null,
      }, 
      user: {
        ...user,
        salary: user.salary?.toNumber() || null,
        hourlyRate: user.hourlyRate?.toNumber() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } 
    };
  });

  // Send verification email outside the transaction
  await sendVerificationEmail(email, verificationToken);

  return result;
}

export async function getBusinessName(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  return business?.name || "Global Admin";
}
