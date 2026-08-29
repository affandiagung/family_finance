import { getSupabaseClient, handleError, json, methodNotAllowed } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');

  try {
    const client = await getSupabaseClient();

    if (req.method === 'PUT') {
      const updates: Record<string, any> = {};
      if (req.body?.name !== undefined) updates.name = req.body.name;
      if (req.body?.type !== undefined) updates.type = req.body.type;
      if (req.body?.icon !== undefined) updates.icon = req.body.icon;
      if (req.body?.color !== undefined) updates.color = req.body.color;

      const { error } = await client.from('categories').update(updates).eq('id', id);
      if (error) return json(res, 500, { success: false, error: `Gagal update ke Supabase: ${error.message}` });
      return json(res, 200, { success: true, data: { id, ...req.body } });
    }

    if (req.method === 'DELETE') {
      const { error } = await client.from('categories').delete().eq('id', id);
      if (error) return json(res, 500, { success: false, error: `Gagal hapus di Supabase: ${error.message}` });
      return json(res, 200, { success: true, message: 'Kategori berhasil dihapus' });
    }

    return methodNotAllowed(res);
  } catch (err: any) {
    return handleError(res, err, 'Gagal memproses kategori');
  }
}
