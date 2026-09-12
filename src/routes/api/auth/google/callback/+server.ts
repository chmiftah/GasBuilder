import 'dotenv/config';
import { type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { exchangeCodeForTokens } from '$lib/server/googleScriptApi';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		return new Response(`<h3>Autentikasi Dibatalkan: ${error}</h3><script>setTimeout(() => window.close(), 3000);</script>`, {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	if (!code) {
		return new Response('<h3>Kode otorisasi tidak ditemukan.</h3>', {
			headers: { 'Content-Type': 'text/html' },
			status: 400
		});
	}

	const clientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
	const clientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
	const redirectUri = env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;


	try {
		const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

		// Simpan token di cookie HTTPOnly atau sampaikan ke window parent
		cookies.set('google_access_token', tokens.access_token, {
			path: '/',
			httpOnly: false,
			secure: false,
			maxAge: 3600
		});

		// Render HTML script to communicate with opener or redirect
		const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Login Berhasil</title>
  <style>
    body { background: #0b0f19; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; }
    h2 { color: #10b981; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>✓ Autentikasi Google Berhasil!</h2>
    <p>Menghubungkan akun ke GAS Builder...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: '${tokens.access_token}' }, '*');
      window.close();
    } else {
      window.location.href = '/';
    }
  </script>
</body>
</html>
`;
		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	} catch (err: any) {
		return new Response(`<h3>Gagal menukar token: ${err.message}</h3>`, {
			headers: { 'Content-Type': 'text/html' },
			status: 500
		});
	}
};
