import { getSupabaseClient, handleError, json, methodNotAllowed } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');

  try {
    const client = await getSupabaseClient();

    if (req.method === 'PUT') {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (req.body?.type !== undefined) updates.type = req.body.type;
      if (req.body?.amount !== undefined) updates.amount = Number(req.body.amount) || 0;
      if (req.body?.date !== undefined) updates.date = req.body.date;
      if (req.body?.categoryId !== undefined) updates.category_id = req.body.categoryId;
      if (req.body?.categoryName !== undefined) updates.category_name = req.body.categoryName;
      if (req.body?.categoryIcon !== undefined) updates.category_icon = req.body.categoryIcon;
      if (req.body?.categoryColor !== undefined) updates.category_color = req.body.categoryColor;
      if (req.body?.description !== undefined) updates.description = req.body.description;
      if (req.body?.familyMemberId !== undefined) updates.family_member_id = req.body.familyMemberId;
      if (req.body?.familyMemberName !== undefined) updates.family_member_name = req.body.familyMemberName;
      if (req.body?.paymentMethod !== undefined) updates.payment_method = req.body.paymentMethod;

      const updatedTx = { id, ...req.body, updatedAt: updates.updated_at };
      const { error } = await client.from('transactions').update(updates).eq('id', id);
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
