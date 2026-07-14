ALTER TYPE "OrderStatus" ADD VALUE 'fulfilled';

ALTER TYPE "ReservationStatus" ADD VALUE 'fulfilled';

ALTER TYPE "StockMovementReason" ADD VALUE 'sale_fulfilled';

ALTER TABLE "orders" ADD COLUMN "fulfilled_at" TIMESTAMP(3);

ALTER TABLE "inventory_reservations" ADD COLUMN "fulfilled_at" TIMESTAMP(3);
