-- CreateEnum
CREATE TYPE "MESSAGE_TYPE" AS ENUM ('TEXT', 'NEW_CHANNEL', 'JOIN_CHANNEL', 'LEAVE_CHANNEL', 'KICK_USER', 'INVITE_USER', 'BAN_USER', 'REVOKE_USER');

-- CreateEnum
CREATE TYPE "CHAT_USER_RELATION" AS ENUM ('ADMIN', 'USER', 'KICKED', 'BANNED', 'INVITED');

-- CreateTable
CREATE TABLE "Chat" (
    "id" UUID NOT NULL,
    "chatname" VARCHAR(256) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "isPrivate" BOOLEAN NOT NULL,
    "adminId" UUID NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" VARCHAR(256) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKicks" (
    "chatId" UUID NOT NULL,
    "kickerId" UUID NOT NULL,
    "kickedId" UUID NOT NULL,

    CONSTRAINT "UserKicks_pkey" PRIMARY KEY ("chatId","kickerId","kickedId")
);

-- CreateTable
CREATE TABLE "UserOnChats" (
    "userId" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "relation" "CHAT_USER_RELATION" NOT NULL,

    CONSTRAINT "UserOnChats_pkey" PRIMARY KEY ("userId","chatId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageType" "MESSAGE_TYPE" NOT NULL,
    "userId" UUID NOT NULL,
    "chatId" UUID NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_chatname_key" ON "Chat"("chatname");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKicks" ADD CONSTRAINT "UserKicks_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKicks" ADD CONSTRAINT "UserKicks_kickerId_fkey" FOREIGN KEY ("kickerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKicks" ADD CONSTRAINT "UserKicks_kickedId_fkey" FOREIGN KEY ("kickedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnChats" ADD CONSTRAINT "UserOnChats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnChats" ADD CONSTRAINT "UserOnChats_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
