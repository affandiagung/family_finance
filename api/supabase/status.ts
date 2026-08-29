export default async function handler(_req: any, res: any) {
  try {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const key = (
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim();

    if (!url || !key || !url.startsWith('http')) {
      return res.status(200).json({
        success: true,
        data: {
          connected: false,
          configured: false,
          message: 'Supabase URL & Key belum diatur di server. Pastikan SUPABASE_URL dan SUPABASE_KEY sudah ada di Environment Variables Vercel lalu redeploy.',
          url: url ? `${url.substring(0, 15)}...` : null,
          tableTransactions: false,
          tableCategories: false,
          tableSettings: false,
          transactionCount: 0,
        },
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout ke server Supabase (8s). Periksa URL/Network.')), 8000)
    );

    const checkPromise = (async () => {
      const { data: txData, error: txErr, count: txCount } = await client
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      const { error: catErr } = await client.from('categories').select('id').limit(1);

      const { error: setErr } = await client
        .from('settings')
        .select('*')
        .eq('id', 'app_settings')
        .maybeSingle();

      return { txData, txErr, txCount, catErr, setErr };
    })();

    const result: any = await Promise.race([checkPromise, timeoutPromise]);
    const { txData, txErr, txCount, catErr, setErr } = result;
    const connected = !txErr && !catErr && !setErr;

    return res.status(200).json({
      success: true,
      data: {
        connected,
        configured: true,
        url: `${url.replace(/^https?:\/\//, '').split('.')[0]}.supabase.co`,
        tableTransactions: !txErr,
        tableCategories: !catErr,
        tableSettings: !setErr,
        transactionCount: txCount ?? (txData ? txData.length : 0),
        message: connected
          ? 'Berhasil! Terhubung secara langsung dan aktif ke Database Supabase PostgreSQL.'
          : `Database terdeteksi tetapi tabel belum siap: ${txErr?.message || catErr?.message || setErr?.message || 'Tabel belum ada'}. Silakan jalankan Skrip SQL Migration di Supabase SQL Editor.`,
        txError: txErr ? txErr.message : null,
        setError: setErr ? setErr.message : null,
        catError: catErr ? catErr.message : null,
      },
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      data: {
        connected: false,
        configured: true,
        message: `Gagal terkoneksi ke Supabase/Vercel Function: ${err?.message || err}`,
      },
    });
  }
}
