import {
  fromSupabaseCategoryRow,
  getSupabaseClient,
  handleError,
  json,
  methodNotAllowed,
  toSupabaseCategoryRow,
} from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    const client = await getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await client.from('categories').select('*').order('created_at', { ascending: true });
      if (error) return json(res, 500, { success: false, error: `Supabase Error: ${error.message}` });
      return json(res, 200, { success: true, source: 'supabase', data: (data || []).map(fromSupabaseCategoryRow) });
    }

    if (req.method === 'POST') {
      const newCat = {
        id: req.body?.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: req.body?.name,
        type: req.body?.type || 'expense',
        icon: req.body?.icon || 'Receipt',
        color: req.body?.color || (req.body?.type === 'expense' ? '#F43F5E' : '#10B981'),
        createdAt: new Date().toISOString(),
      };
      const { error } = await client.from('categories').insert(toSupabaseCategoryRow(newCat));
      if (error) return json(res, 500, { success: false, error: `Gagal simpan ke Supabase: ${error.message}` });
      return json(res, 201, { success: true, data: newCat });
    }

    return methodNotAllowed(res);
  } catch (err: any) {
    return handleError(res, err, 'Gagal memproses kategori');
  }
}
