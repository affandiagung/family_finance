import {
  fromSupabaseTransactionRow,
  getSupabaseClient,
  handleError,
  json,
  methodNotAllowed,
  toSupabaseTransactionRow,
} from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    const client = await getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) return json(res, 500, { success: false, error: `Supabase Error: ${error.message}` });
      return json(res, 200, { success: true, source: 'supabase', data: (data || []).map(fromSupabaseTransactionRow) });
    }

    if (req.method === 'POST') {
      const newTx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        familyMemberId: 'family',
        familyMemberName: 'Keluarga',
        ...req.body,
      };
      const { error } = await client.from('transactions').insert(toSupabaseTransactionRow(newTx));
      if (error) return json(res, 500, { success: false, error: `Gagal simpan transaksi ke Supabase: ${error.message}` });
      return json(res, 201, { success: true, data: newTx });
    }

    return methodNotAllowed(res);
  } catch (err: any) {
    return handleError(res, err, 'Gagal memproses transaksi');
  }
}
