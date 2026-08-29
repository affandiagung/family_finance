import {
  DEFAULT_SETTINGS,
  fromSupabaseSettingsRow,
  getSupabaseClient,
  handleError,
  json,
  methodNotAllowed,
  toSupabaseSettingsRow,
} from './_lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    const client = await getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await client.from('settings').select('*').eq('id', 'app_settings').maybeSingle();
      if (error) return json(res, 500, { success: false, error: `Supabase Error: ${error.message}` });
      return json(res, 200, {
        success: true,
        source: 'supabase',
        data: data ? fromSupabaseSettingsRow(data) : DEFAULT_SETTINGS,
      });
    }

    if (req.method === 'POST') {
      const settings = { ...DEFAULT_SETTINGS, ...req.body };
      const { error } = await client.from('settings').upsert(toSupabaseSettingsRow(settings));
      if (error) return json(res, 500, { success: false, error: `Gagal simpan settings ke Supabase: ${error.message}` });
      return json(res, 200, { success: true, data: settings });
    }

    return methodNotAllowed(res);
  } catch (err: any) {
    return handleError(res, err, 'Gagal memproses settings');
  }
}
