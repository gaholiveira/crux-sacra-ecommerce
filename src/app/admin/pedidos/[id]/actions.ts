"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/dal";

const orderStatusValues = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const updateSchema = z.object({
  status: z.enum(orderStatusValues),
  carrier: z.string().trim().optional(),
  trackingCode: z.string().trim().optional(),
});

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.parse({
    status: formData.get("status"),
    carrier: formData.get("carrier") || undefined,
    trackingCode: formData.get("trackingCode") || undefined,
  });

  // $transaction garante que o pedido e o registro de auditoria mudam juntos
  // ou não muda nenhum dos dois.
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: parsed.status,
        carrier: parsed.carrier,
        trackingCode: parsed.trackingCode,
      },
    }),
    prisma.orderStatusEvent.create({
      data: {
        orderId,
        status: parsed.status,
        note: "Status alterado manualmente pelo admin",
      },
    }),
  ]);

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
}
