-- Sprint 7.0: align invoice financial totals with order snapshots

ALTER TABLE "invoices" ADD COLUMN "discount_amount" DECIMAL(12, 2);
ALTER TABLE "invoices" ADD COLUMN "total" DECIMAL(12, 2);

UPDATE "invoices" SET "total" = "subtotal" WHERE "total" IS NULL;

ALTER TABLE "invoices" ALTER COLUMN "total" SET NOT NULL;
