export default function handler(_req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  return res.status(200).json({
    success: true,
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV || null,
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseKey: Boolean(supabaseKey),
    supabaseUrlLength: supabaseUrl.length,
    supabaseKeyLength: supabaseKey.length,
  });
}
