import { randomUUID } from 'node:crypto';

type Conn = { url: string; db: string; username?: string; uid?: number; apiKey: string };
type RawInvoice = { id: number; name: string; amount_total: number; partner_id?: [number, string]; invoice_date: string | null; write_date: string };

async function rpc(url: string, service: string, method: string, args: unknown[]) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args }, id: Math.floor(Math.random() * 1_000_000) }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (data.error) throw new Error(`Odoo RPC error: ${JSON.stringify(data.error.data?.message || data.error)}`);
      return data.result;
    } catch (error) {
      if (attempt === 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Odoo request failed');
}

export async function authenticate(connection: Conn) {
  return rpc(connection.url, 'common', 'authenticate', [connection.db, connection.username, connection.apiKey, {}]) as Promise<number>;
}

export async function executeKw(connection: Conn, model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}) {
  return rpc(connection.url, 'object', 'execute_kw', [connection.db, connection.uid, connection.apiKey, model, method, args, kwargs]);
}

export type OdooInvoice = {
  id: number; name: string; amountTotal: number; invoiceDate: string | null; writeDate: string;
  partnerName: string; partnerPhone: string | null; invoiceUrl: string | null;
};

export async function getRecentPostedInvoices(connection: Conn, sinceIso: string, limit = 50): Promise<OdooInvoice[]> {
  const domain = [['state', '=', 'posted'], ['move_type', '=', 'out_invoice'], ['write_date', '>', sinceIso]];
  const rows: RawInvoice[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await executeKw(connection, 'account.move', 'search_read', [domain], {
      fields: ['id', 'name', 'amount_total', 'partner_id', 'invoice_date', 'write_date'],
      order: 'id desc', limit, offset,
    }) as RawInvoice[];
    rows.push(...page);
    if (page.length < limit) break;
  }
  if (!rows.length) return [];

  const tokenById: Record<number, string | null> = {};
  try {
    const tokenRows = await executeKw(connection, 'account.move', 'read', [rows.map((invoice) => invoice.id)], { fields: ['access_token'] }) as Array<{ id: number; access_token?: string }>;
    for (const row of tokenRows) tokenById[row.id] = row.access_token || null;
    for (const id of rows.map((invoice) => invoice.id).filter((invoiceId) => !tokenById[invoiceId])) {
      const token = randomUUID();
      try {
        await executeKw(connection, 'account.move', 'write', [[id], { access_token: token }]);
        tokenById[id] = token;
      } catch { /* invoice URL remains unavailable when Odoo rejects token writes */ }
    }
  } catch { /* access token read failure means invoice links are omitted */ }

  const partnerIds = [...new Set(rows.map((invoice) => invoice.partner_id?.[0]).filter((id): id is number => !!id))];
  let partners: Array<{ id: number; name?: string; mobile?: string; phone?: string }>;
  try {
    partners = await executeKw(connection, 'res.partner', 'read', [partnerIds], { fields: ['name', 'mobile', 'phone'] }) as typeof partners;
  } catch {
    partners = await executeKw(connection, 'res.partner', 'read', [partnerIds], { fields: ['name', 'phone'] }) as typeof partners;
  }
  const partnersById = Object.fromEntries(partners.map((partner) => [partner.id, partner]));

  return rows.map((invoice) => {
    const partner = invoice.partner_id ? partnersById[invoice.partner_id[0]] : undefined;
    const token = tokenById[invoice.id];
    return {
      id: invoice.id,
      name: invoice.name,
      amountTotal: Number(invoice.amount_total),
      invoiceDate: invoice.invoice_date,
      writeDate: invoice.write_date,
      partnerName: partner?.name || 'Customer',
      partnerPhone: partner?.mobile || partner?.phone || null,
      invoiceUrl: token ? `${connection.url.replace(/\/+$/, '')}/mail/view?model=account.move&res_id=${invoice.id}&access_token=${token}&report_type=pdf&download=true` : null,
    };
  });
}
