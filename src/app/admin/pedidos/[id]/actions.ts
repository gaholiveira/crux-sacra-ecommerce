"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/dal";
import { emitInvoice, refreshInvoiceStatus, cancelInvoice } from "@/lib/focusnfe";

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

export type InvoiceActionState = { error?: string } | null;

export async function emitInvoiceAction(
  orderId: string,
  _prevState: InvoiceActionState,
  _formData: FormData,
): Promise<InvoiceActionState> {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      shippingAddress: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order) {
    return { error: "Pedido não encontrado" };
  }

  try {
    await emitInvoice(order);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao emitir nota fiscal" };
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  return null;
}

export async function refreshInvoiceStatusAction(
  orderId: string,
  _prevState: InvoiceActionState,
  _formData: FormData,
): Promise<InvoiceActionState> {
  await requireAdmin();

  const invoice = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  if (!invoice) {
    return { error: "Nenhuma nota encontrada pra esse pedido" };
  }

  try {
    await refreshInvoiceStatus(invoice.ref);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao consultar status" };
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  return null;
}

export async function cancelInvoiceAction(
  orderId: string,
  _prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await requireAdmin();

  const justificativa = String(formData.get("justificativa") ?? "").trim();
  const invoice = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  if (!invoice) {
    return { error: "Nenhuma nota encontrada pra esse pedido" };
  }

  try {
    await cancelInvoice(invoice.ref, justificativa);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao cancelar nota" };
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  return null;
}
