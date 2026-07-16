-- Sprint 10.3: In-App Notification Center read state
ALTER TABLE "notifications" ADD COLUMN "read_at" TIMESTAMP(3);

CREATE INDEX "notifications_store_id_user_id_channel_read_at_idx"
  ON "notifications"("store_id", "user_id", "channel", "read_at");
