-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_walletAddress_key" ON "Admin"("walletAddress");

-- Seed primary admin wallet (ChefCito treasury)
INSERT INTO "Admin" ("id", "walletAddress", "role", "createdAt")
VALUES (
    'admin_chefcito',
    '0x089189b7942588bdbadcc5cfc8e76d8bd1073bd4',
    'ADMIN',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("walletAddress") DO NOTHING;
