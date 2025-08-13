/*
  Warnings:

  - You are about to drop the column `ja` on the `language_packs` table. All the data in the column will be lost.
  - Added the required column `jp` to the `language_packs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "language_packs" DROP COLUMN "ja",
ADD COLUMN     "jp" TEXT NOT NULL;
