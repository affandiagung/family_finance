import { checkSupabaseStatus } from '../../server/supabase';

export default async function handler(_req: any, res: any) {
  try {
    const status = await checkSupabaseStatus();
    return res.status(200).json({ success: true, data: status });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Gagal memeriksa status Supabase',
    });
  }
}
