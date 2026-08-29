import { getSupabaseClient, handleError, json, methodNotAllowed, toSupabaseTransactionRow } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');

  try {
    const client = await getSupabaseClient();

    if (req.method === 'PUT') {
      const updatedTx = { id, ...req.body, updatedAt: new Date().toISOString() };
      const { error } = await client.from('transactions').update(toSupabaseTransactionRow(updatedTx)).eq('id', id);
      if (error) return json(res, 500, { success: false, error: `Gagal update transaksi di Supabase: ${error.message}` });
      return json(res, 200, { success: true, data: updatedTx });
    }

    if (req.method === 'DELETE') {
      const { error } = await client.from('transactions').delete().eq('id', id);
      if (error) return json(res, 500, { success: false, error: `Gagal hapus transaksi di Supabase: ${error.message}` });
      return json(res, 200, { success: true, message: 'Transaksi berhasil dihapus' });
    }

    return methodNotAllowed(res);
  } catch (err: any) {
    return handleError(res, err, 'Gagal memproses transaksi');
  }
}
