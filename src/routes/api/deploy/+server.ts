import { json, type RequestHandler } from '@sveltejs/kit';
import { deployToGoogleAccount } from '$lib/server/googleScriptApi';
import type { GASFile, PRDSpec } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { accessToken, files, prd, isSimulation, scriptId, spreadsheetUrl } = (await request.json()) as {
			accessToken?: string;
			files: GASFile[];
			prd: PRDSpec;
			isSimulation?: boolean;
			scriptId?: string;
			spreadsheetUrl?: string;
		};

		if (!files || !prd) {
			return json({ error: 'Files and PRD are required' }, { status: 400 });
		}

		// If accessToken is provided and not in simulation mode, perform live deploy to Google Account
		if (accessToken && !isSimulation) {
			const result = await deployToGoogleAccount(accessToken, files, prd, scriptId, spreadsheetUrl);
			return json(result);
		}

		// Simulation Mode for testing / sandbox demo
		const randomId = 'AKfycb' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);
		const randomSheetId = '1' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		return json({
			success: true,
			isSimulation: true,
			scriptId: randomId,
			scriptUrl: `https://script.google.com/d/${randomId}/edit`,
			deployedUrl: `https://script.google.com/macros/s/${randomId}/exec`,
			spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${randomSheetId}/edit`,
			message: 'Deployment simulasi berhasil!'
		});
	} catch (error: any) {
		console.error('Deploy API error:', error);
		return json({ error: error.message || 'Deployment error' }, { status: 500 });
	}
};
