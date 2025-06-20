-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "status" TEXT NOT NULL,
    "currentFlag" TEXT,
    "flagHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tugIndex" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
