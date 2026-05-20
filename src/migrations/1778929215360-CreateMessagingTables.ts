import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagingTables1778929215360 implements MigrationInterface {
  name = 'CreateMessagingTables1778929215360';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."chats_type_enum" AS ENUM('direct', 'group', 'channel')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" SERIAL NOT NULL, "type" "public"."chats_type_enum" NOT NULL DEFAULT 'direct', "directKey" character varying, "slug" character varying(120), "isPublic" boolean NOT NULL DEFAULT false, "title" character varying(120), "description" character varying(500), "avatarUrl" character varying, "lastMessageId" integer, "lastMessageAt" TIMESTAMP WITH TIME ZONE, "messagesCount" integer NOT NULL DEFAULT 0, "membersCount" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2017201bf067c1a10ee01188021" UNIQUE ("directKey"), CONSTRAINT "UQ_93028c9a5c24b244cfac9d59cab" UNIQUE ("slug"), CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."chat_members_role_enum" AS ENUM('owner', 'admin', 'member', 'subscriber')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_members" ("id" SERIAL NOT NULL, "chatId" integer NOT NULL, "profileId" integer NOT NULL, "role" "public"."chat_members_role_enum" NOT NULL DEFAULT 'member', "isMuted" boolean NOT NULL DEFAULT false, "isPinned" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "lastReadMessageId" integer, "lastReadAt" TIMESTAMP WITH TIME ZONE, "unreadCount" integer NOT NULL DEFAULT 0, "joinedAt" TIMESTAMP WITH TIME ZONE, "leftAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_aea646f59c92c47af5804ce73a7" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_d165dd3366d409cb1202fe01d2" ON "chat_members" ("profileId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_812f0bd8beb77a6c8a1451c557" ON "chat_members" ("chatId", "profileId") `,
    );

    await queryRunner.query(
      `CREATE TABLE "message_contents" ("id" SERIAL NOT NULL, "encryptedContent" text, "encryptionVersion" integer, "metadata" jsonb, "isPurged" boolean NOT NULL DEFAULT false, "isEncrypted" boolean NOT NULL DEFAULT false, "checksum" character varying, "blurhash" character varying, "fileName" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_03279c256f7af6160464f6a1515" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."message_attachments_type_enum" AS ENUM('image', 'video', 'voice', 'file', 'audio')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_attachments" ("id" SERIAL NOT NULL, "messageId" integer NOT NULL, "type" "public"."message_attachments_type_enum" NOT NULL, "storageKey" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "width" integer, "height" integer, "duration" integer, "thumbnailKey" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e5085d973567c61e9306f10f95b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b4f24737fcb6b35ffdd4d16e1" ON "message_attachments" ("messageId") `,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum" AS ENUM('text', 'image', 'video', 'voice', 'file', 'system', 'call')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('sending', 'sent', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "messages" ("id" SERIAL NOT NULL, "chatId" integer NOT NULL, "senderMemberId" integer, "clientId" character varying(120), "type" "public"."messages_type_enum" NOT NULL DEFAULT 'text', "status" "public"."messages_status_enum" NOT NULL DEFAULT 'sent', "contentId" integer, "hasAttachments" boolean NOT NULL DEFAULT false, "replyToMessageId" integer, "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_796887c8af1498a09ba2291364" UNIQUE ("contentId"), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_4e18c5bd9344f845152f61f5c5" ON "messages" ("replyToMessageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6896838b4d2e83bef3dd600bf" ON "messages" ("senderMemberId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_500d64127ca9df75640c19af40"
   ON "messages" ("chatId", "createdAt" DESC, "id" DESC)`,
    );

    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_e98bf961346b1b32adf306136c6" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_d165dd3366d409cb1202fe01d29" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "message_attachments" ADD CONSTRAINT "FK_5b4f24737fcb6b35ffdd4d16e13" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_b6896838b4d2e83bef3dd600bfb" FOREIGN KEY ("senderMemberId") REFERENCES "chat_members"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_796887c8af1498a09ba2291364e" FOREIGN KEY ("contentId") REFERENCES "message_contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_4e18c5bd9344f845152f61f5c53" FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_4e18c5bd9344f845152f61f5c53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_796887c8af1498a09ba2291364e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_b6896838b4d2e83bef3dd600bfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115"`,
    );

    await queryRunner.query(
      `ALTER TABLE "message_attachments" DROP CONSTRAINT "FK_5b4f24737fcb6b35ffdd4d16e13"`,
    );

    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_d165dd3366d409cb1202fe01d29"`,
    );

    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_e98bf961346b1b32adf306136c6"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_500d64127ca9df75640c19af40"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6896838b4d2e83bef3dd600bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e18c5bd9344f845152f61f5c5"`,
    );

    await queryRunner.query(`DROP TABLE "message_attachments"`);

    await queryRunner.query(`DROP TABLE "messages"`);

    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b4f24737fcb6b35ffdd4d16e1"`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."message_attachments_type_enum"`,
    );

    await queryRunner.query(`DROP TABLE "message_contents"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_812f0bd8beb77a6c8a1451c557"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d165dd3366d409cb1202fe01d2"`,
    );
    await queryRunner.query(`DROP TABLE "chat_members"`);
    await queryRunner.query(`DROP TYPE "public"."chat_members_role_enum"`);

    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TYPE "public"."chats_type_enum"`);
  }
}
