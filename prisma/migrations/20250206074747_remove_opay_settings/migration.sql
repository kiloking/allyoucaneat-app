/*
  Warnings:

  - Added the required column `channelUrl` to the `OpaySettings` table without a default value. This is not possible if the table is not empty.
  - Made the column `opayId` on table `OpaySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `alertSound` on table `OpaySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `alertImage` on table `OpaySettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OpaySettings" ADD COLUMN     "channelUrl" TEXT NOT NULL,
ALTER COLUMN "opayId" SET NOT NULL,
ALTER COLUMN "alertSound" SET NOT NULL,
ALTER COLUMN "alertImage" SET NOT NULL;
