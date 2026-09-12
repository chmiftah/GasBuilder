import 'dotenv/config';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getGoogleAuthUrl } from '$lib/server/googleScriptApi';

export const GET: RequestHandler = async ({ url }) => {
	const clientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
	const redirectUri = env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

	if (!clientId) {
		return new Response('GOOGLE_CLIENT_ID belum dikonfigurasi di file .env', { status: 400 });
	}

	const authUrl = getGoogleAuthUrl(clientId, redirectUri);
	throw redirect(302, authUrl);
};

