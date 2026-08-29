import { getSupabaseClient, handleError, json, methodNotAllowed, toSupabaseCategoryRow } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');

  try {
    const client = await getSupabaseClient();

    if (req.method === 'PUT') {
      const updatedCat = { id, ...req.body };
      const { error } = await client.from('categories').update(toSupabaseCategoryRow(updatedCat)).eq('id', id);
      if (error) return json(res, 500, { success: false, error: `Gagal update ke Supabase: ${error.message}` });
      return json(res, 200, { success: true, data: updatedCat });
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
