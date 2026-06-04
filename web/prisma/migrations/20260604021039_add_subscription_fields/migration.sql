-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "flutterwaveRef" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'INACTIVE';
