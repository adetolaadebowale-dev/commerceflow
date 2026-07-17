-- CreateTable
CREATE TABLE "platform_configurations" (
    "id" UUID NOT NULL,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_configurations_pkey" PRIMARY KEY ("id")
);
