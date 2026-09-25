import "server-only";
import { prisma } from "@/lib/prisma";

// ============================================================================
// CONFIGURAÇÃO FISCAL — revisar com o contador antes de emitir em produção
// ============================================================================
// Esses valores dependem do regime tributário real da empresa (Simples
// Nacional, Lucro Presumido, etc.) e não têm como ser adivinhados com
// segurança pelo código. Mantidos isolados aqui, num lugar só, em vez de
// espalhados pelo monte de payload — errar isso gera uma nota fiscal
// inválida (ou pior, uma nota válida com imposto errado).
export const TAX_CONFIG = {
  // UF do emitente — usado só pra decidir CFOP interno (5102) vs
  // interestadual (6108) comparando com a UF do endereço de entrega.
  emitterUf: "SP",
  // 1 = Simples Nacional, 2 = Simples Nacional excesso de sublimite,
  // 3 = Regime Normal. CONFIRME com o contador antes de usar em produção.
  regimeTributarioEmitente: "1",
  // CSOSN pra Simples Nacional — 102 = "Tributada pelo Simples Nacional sem
  // permissão de crédito", o mais comum pra revenda de mercadoria por
  // empresa do Simples. Se o regime não for Simples Nacional, isso precisa
  // virar um código de icms_situacao_tributaria (CST) diferente, não CSOSN.
  icmsSituacaoTributaria: "102",
  pisSituacaoTributaria: "99",
  cofinsSituacaoTributaria: "99",
} as const;

// Dados cadastrais da própria empresa (emitente) — confirmados testando
// contra a API de verdade: o suporte da Focus NFe apontou que o payload
// precisa desses campos mesmo a empresa já estando cadastrada no painel
// deles (não é preenchido automaticamente a partir do cadastro). Mantidos
// isolados aqui pelo mesmo motivo do TAX_CONFIG: errar isso gera uma nota
// inválida. Atualize se o endereço/IE da empresa mudar no painel da
// Focus NFe.
export const EMITTER = {
  cnpj: "62463131000162",
  razaoSocial: "ISADORA MATOS FERREIRA LTDA",
  nomeFantasia: "ISADORA MATOS FERREIRA LTDA",
  logradouro: "Rua Cassiano Ricardo",
  numero: "441",
  bairro: "Parque Residencial Nova Franca",
  municipio: "Franca",
  uf: "SP",
  cep: "14409214",
  inscricaoEstadual: "155538485112",
} as const;

function getTestMode(): boolean {
  return process.env.FOCUS_NFE_TEST_MODE === "true";
}

function getBaseUrl(): string {
  return getTestMode() ? "https://homologacao.focusnfe.com.br" : "https://api.focusnfe.com.br";
}

function getToken(): string {
  const token = process.env.FOCUS_NFE_TOKEN;
  if (!token) {
    throw new Error("FOCUS_NFE_TOKEN precisa estar definido no .env");
  }
  return token;
}

// Autenticação HTTP Basic com o token como usuário e senha vazia — não é um
// header Bearer, confirmado direto na documentação da Focus NFe.
function authHeader(): string {
  return `Basic ${Buffer.from(`${getToken()}:`).toString("base64")}`;
}

async function focusNfeFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);
  return { response, body };
}

// CFOP de venda de mercadoria pra consumidor final — 5102 dentro do estado,
// 6108 fora. Não cobre substituição tributária nem venda pra revenda
// (destinatário não-consumidor-final) — fora do escopo da primeira versão.
export function mapCfop(destinatarioUf: string): string {
  return destinatarioUf === TAX_CONFIG.emitterUf ? "5102" : "6108";
}

type InvoiceOrder = {
  id: string;
  totalCents: number;
  user: { name: string | null; email: string; cpf: string | null };
  shippingAddress: {
    recipient: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: {
    id: string;
    productName: string;
    variantName: string;
    unitPriceCents: number;
    quantity: number;
    variant: { product: { ncm: string | null } };
  }[];
};

export class MissingNcmError extends Error {
  constructor(productNames: string[]) {
    super(`Produto(s) sem NCM cadastrado: ${productNames.join(", ")}`);
    this.name = "MissingNcmError";
  }
}

function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

// "ref" só pode ter letras/números — o id do pedido (uuid com hífen) não
// serve puro, então remove os hífens em vez de gerar um id novo: assim o
// ref continua determinístico a partir do pedido (importante pra conseguir
// checar "já existe uma tentativa pra esse pedido?" sem guardar nada extra).
export function orderRef(orderId: string): string {
  return `crux${orderId.replace(/-/g, "")}`;
}

export function buildInvoicePayload(order: InvoiceOrder) {
  const missingNcm = order.items
    .filter((item) => !item.variant.product.ncm)
    .map((item) => item.productName);
  if (missingNcm.length > 0) {
    throw new MissingNcmError([...new Set(missingNcm)]);
  }

  if (!order.user.cpf) {
    throw new Error("Cliente sem CPF cadastrado — não é possível emitir nota fiscal.");
  }

  const cfop = mapCfop(order.shippingAddress.state);

  return {
    natureza_operacao: "Venda de mercadoria",
    data_emissao: new Date().toISOString(),
    tipo_documento: 1,
    finalidade_emissao: 1,
    consumidor_final: 1,
    // 2 = "Operação não presencial, pela internet" — código padrão de
    // e-commerce na tabela do Presença do Comprador.
    presenca_comprador: 2,
    local_destino: order.shippingAddress.state === TAX_CONFIG.emitterUf ? 1 : 2,
    // Sem cobrança de frete separada no pedido hoje — revisar se isso mudar.
    modalidade_frete: 9,
    valor_frete: "0.00",
    valor_seguro: "0.00",
    valor_desconto: "0.00",
    valor_outras_despesas: "0.00",
    valor_produtos: centsToDecimal(order.totalCents),
    valor_total: centsToDecimal(order.totalCents),

    regime_tributario_emitente: TAX_CONFIG.regimeTributarioEmitente,

    cnpj_emitente: EMITTER.cnpj,
    nome_emitente: EMITTER.razaoSocial,
    nome_fantasia_emitente: EMITTER.nomeFantasia,
    logradouro_emitente: EMITTER.logradouro,
    numero_emitente: EMITTER.numero,
    bairro_emitente: EMITTER.bairro,
    municipio_emitente: EMITTER.municipio,
    uf_emitente: EMITTER.uf,
    cep_emitente: EMITTER.cep,
    inscricao_estadual_emitente: EMITTER.inscricaoEstadual,

    nome_destinatario: order.shippingAddress.recipient || order.user.name || "Consumidor",
    cpf_destinatario: order.user.cpf,
    email_destinatario: order.user.email,
    logradouro_destinatario: order.shippingAddress.street,
    numero_destinatario: order.shippingAddress.number,
    complemento_destinatario: order.shippingAddress.complement ?? undefined,
    bairro_destinatario: order.shippingAddress.district,
    municipio_destinatario: order.shippingAddress.city,
    uf_destinatario: order.shippingAddress.state,
    cep_destinatario: order.shippingAddress.postalCode.replace(/\D/g, ""),
    pais_destinatario: "Brasil",
    indicador_inscricao_estadual_destinatario: 9, // 9 = não contribuinte

    items: order.items.map((item, index) => ({
      numero_item: index + 1,
      codigo_produto: item.id,
      descricao: `${item.productName} - ${item.variantName}`,
      cfop,
      codigo_ncm: item.variant.product.ncm,
      unidade_comercial: "UN",
      quantidade_comercial: item.quantity,
      valor_unitario_comercial: centsToDecimal(item.unitPriceCents),
      valor_bruto: centsToDecimal(item.unitPriceCents * item.quantity),
      unidade_tributavel: "UN",
      quantidade_tributavel: item.quantity,
      valor_unitario_tributavel: centsToDecimal(item.unitPriceCents),
      icms_origem: "0",
      icms_situacao_tributaria: TAX_CONFIG.icmsSituacaoTributaria,
      pis_situacao_tributaria: TAX_CONFIG.pisSituacaoTributaria,
      cofins_situacao_tributaria: TAX_CONFIG.cofinsSituacaoTributaria,
    })),
  };
}

type InvoiceStatusData = {
  status?: string;
  numero?: string;
  serie?: string;
  chave_nfe?: string;
  status_sefaz?: string;
  mensagem_sefaz?: string;
  caminho_xml_nota_fiscal?: string;
  caminho_danfe?: string;
};

// Ponto único de verdade — usado tanto pelo webhook quanto pela consulta
// manual (mesma ideia do applyPaymentResult em mercadopago.ts). Faz upsert
// pelo ref, então chegar duas vezes (webhook + refresh manual) não duplica
// nem sobrescreve com dado mais antigo por engano.
export async function applyInvoiceStatus(ref: string, data: InvoiceStatusData) {
  const status =
    data.status === "autorizado"
      ? "AUTHORIZED"
      : data.status === "erro_autorizacao"
        ? "ERROR"
        : data.status === "cancelado"
          ? "CANCELLED"
          : "PROCESSING";

  await prisma.invoice.updateMany({
    where: { ref },
    data: {
      status,
      numero: data.numero,
      serie: data.serie,
      chaveAcesso: data.chave_nfe,
      statusSefaz: data.status_sefaz,
      mensagemSefaz: data.mensagem_sefaz,
      xmlUrl: data.caminho_xml_nota_fiscal,
      danfeUrl: data.caminho_danfe,
      rawPayload: data as object,
    },
  });
}

export async function emitInvoice(order: InvoiceOrder) {
  const ref = orderRef(order.id);

  // "ref" não é idempotente como a chave da Mercado Pago — reenviar um ref
  // já autorizado dá erro em vez de devolver a nota existente. Por isso
  // consulta antes de tentar emitir: só segue pro POST se realmente for a
  // primeira tentativa (ou a anterior nunca chegou a processar).
  const existing = await prisma.invoice.findUnique({ where: { ref } });
  if (existing && existing.status !== "ERROR") {
    return existing;
  }

  const payload = buildInvoicePayload(order);

  const { response, body } = await focusNfeFetch(`/v2/nfe?ref=${ref}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status !== 202 && response.status !== 200) {
    const message =
      body?.mensagem ?? body?.erros?.[0]?.mensagem ?? `Erro ao emitir nota (HTTP ${response.status})`;
    await prisma.invoice.upsert({
      where: { ref },
      update: { status: "ERROR", mensagemSefaz: message, rawPayload: body },
      create: { orderId: order.id, ref, status: "ERROR", mensagemSefaz: message, rawPayload: body },
    });
    throw new Error(message);
  }

  return prisma.invoice.upsert({
    where: { ref },
    update: { status: "PROCESSING", rawPayload: body },
    create: { orderId: order.id, ref, status: "PROCESSING", rawPayload: body },
  });
}

export async function refreshInvoiceStatus(ref: string) {
  const { body } = await focusNfeFetch(`/v2/nfe/${ref}`);
  if (body) {
    await applyInvoiceStatus(ref, body);
  }
  return body;
}

export async function cancelInvoice(ref: string, justificativa: string) {
  if (justificativa.length < 15 || justificativa.length > 255) {
    throw new Error("A justificativa de cancelamento precisa ter entre 15 e 255 caracteres.");
  }

  const { response, body } = await focusNfeFetch(`/v2/nfe/${ref}`, {
    method: "DELETE",
    body: JSON.stringify({ justificativa }),
  });

  if (!response.ok) {
    throw new Error(body?.mensagem ?? `Erro ao cancelar nota (HTTP ${response.status})`);
  }

  await applyInvoiceStatus(ref, body);
  return body;
}
