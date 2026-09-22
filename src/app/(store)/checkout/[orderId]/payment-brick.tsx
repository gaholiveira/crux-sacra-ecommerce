"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// O SDK da Mercado Pago é carregado via <script> global (não é um pacote
// npm para o navegador) — por isso declaramos o formato mínimo que
// realmente usamos, em vez de "any".
type MercadoPagoBrickController = { unmount: () => void };
type MercadoPagoInstance = {
  bricks: () => {
    create: (
      type: string,
      containerId: string,
      settings: Record<string, unknown>,
    ) => Promise<MercadoPagoBrickController>;
  };
};

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

type PixData = { qrCodeBase64: string; qrCode: string };

export function PaymentBrick({
  orderId,
  amount,
  payerEmail,
}: {
  orderId: string;
  amount: number;
  payerEmail: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Presença da chave pública é uma condição estática (não muda entre
  // renders), não um estado — por isso fica fora do efeito, em vez de
  // virar um setState síncrono dentro dele.
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  useEffect(() => {
    if (!sdkReady || !containerRef.current || !publicKey) return;

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

    const controllerPromise = mp.bricks().create("payment", "payment-brick-container", {
      initialization: {
        amount,
        payer: { email: payerEmail },
      },
      customization: {
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          // "bankTransfer" é como a Mercado Pago chama o Pix no Brick.
          bankTransfer: "all",
        },
      },
      callbacks: {
        onReady: () => {},
        onError: (error: unknown) => {
          console.error("Payment Brick error:", error);
          setErrorMessage("Não foi possível carregar o formulário de pagamento.");
        },
        onSubmit: (submission: {
          formData: Record<string, unknown>;
          // A mesma bandeira de cartão (ex: "master") pode ser crédito ou
          // débito — o payment_method_id sozinho não diferencia isso, então
          // precisamos do tipo que o Brick seleciona. A doc da Mercado Pago
          // usa nomes inconsistentes para esse campo entre exemplos, então
          // aceitamos os dois por precaução.
          selectedPaymentMethod?: string;
          paymentMethod?: string;
        }) => {
          const { formData, selectedPaymentMethod, paymentMethod } = submission;
          const mpPaymentType = selectedPaymentMethod ?? paymentMethod;

          return fetch("/api/mercadopago/process-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, orderId, mpPaymentType }),
          })
            .then((res) => res.json())
            .then(
              (result: {
                error?: string;
                status?: string;
                qrCode?: string;
                qrCodeBase64?: string;
              }) => {
                if (result.error) {
                  setErrorMessage(result.error);
                  return;
                }

                if (result.qrCodeBase64 && result.qrCode) {
                  setPixData({ qrCodeBase64: result.qrCodeBase64, qrCode: result.qrCode });
                  return;
                }

                // Cartão aprovado ou pendente sem Pix (ex: boleto): manda
                // pra tela do pedido, que sempre reflete o status real
                // salvo no banco pelo backend — nunca decide "aprovado" só
                // pelo texto de status que a Mercado Pago devolveu aqui.
                // que já mostra "Aguardando pagamento".
                router.push(`/pedidos/${orderId}`);
              },
            )
            .catch(() => {
              setErrorMessage("Falha ao processar pagamento. Tente novamente.");
            });
        },
      },
    });

    return () => {
      controllerPromise.then((controller) => controller.unmount()).catch(() => {});
    };
  }, [sdkReady, publicKey, amount, payerEmail, orderId, router]);

  if (!publicKey) {
    return (
      <p className="text-sm text-red-700">
        Pagamento não configurado (falta a chave pública da Mercado Pago).
      </p>
    );
  }

  if (pixData) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[#D8CDBC] bg-white p-6 text-center">
        <h2 className="text-lg font-semibold">Escaneie o QR Code para pagar com Pix</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URI base64, next/image não aceita */}
        <img
          src={`data:image/png;base64,${pixData.qrCodeBase64}`}
          alt="QR Code do Pix"
          className="h-56 w-56"
        />
        <p className="text-xs text-[#6E6255]">Ou copie o código:</p>
        <textarea
          readOnly
          value={pixData.qrCode}
          rows={3}
          onClick={(e) => e.currentTarget.select()}
          className="w-full rounded-md border border-[#D8CDBC] p-2 text-xs"
        />
        <p className="text-sm text-[#6E6255]">
          Assim que o pagamento for confirmado, o status do pedido atualiza automaticamente.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" onReady={() => setSdkReady(true)} />
      {errorMessage && <p className="mb-3 text-sm text-red-700">{errorMessage}</p>}
      <div id="payment-brick-container" ref={containerRef} />
    </>
  );
}
