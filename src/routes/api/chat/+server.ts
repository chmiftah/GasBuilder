import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { callDeepSeekChat, SYSTEM_ANALYST_PROMPT } from '$lib/server/deepseek';
import type { PRDSpec } from '$lib/types';

/**
 * CODE-LEVEL GATE: returns true only if the user last message
 * contains an explicit PRD confirmation signal.
 * Prompt-level instructions alone are unreliable.
 */
function userConfirmedPrd(messages: Array<{ role: string; content: string }>): boolean {
	const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
	if (!lastUserMsg) return false;

	const text = lastUserMsg.content.toLowerCase().trim();

	// Explicit confirmation token injected by the UI button
	if (lastUserMsg.content.includes('[KONFIRMASI_SUSUN_PRD]')) return true;

	// Natural language confirmation — including short single-word approvals
	const confirmKeywords = [
		// UI button token
		'konfirmasi_susun_prd',
		// Explicit PRD commands
		'susun prd', 'buat prd', 'lanjutkan prd', 'lanjut prd', 'generate prd', 'buatkan prd',
		// Agreement phrases
		'setuju', 'saya setuju', 'oke lanjut', 'ok lanjut', 'ya lanjut', 'ya sudah',
		'lanjutkan saja', 'langsung saja', 'langsung buat', 'oke saja', 'ok saja',
		// Single word approvals (only match if short message)
		'boleh', 'oke', 'siap', 'yap', 'yep', 'lanjut', 'next'
	];

	// For very short messages (≤10 chars), match single-word approvals
	if (text.length <= 10) {
		return confirmKeywords.some((kw) => text.includes(kw));
	}
	// For longer messages, only match multi-word phrases (avoid false positives)
	const multiWordKeywords = confirmKeywords.filter(kw => kw.includes(' ') || kw.length > 6);
	return multiWordKeywords.some((kw) => text.includes(kw));
}

function extractPrdFromText(text: string): PRDSpec | null {
	// Strategy 1: Prefer explicit json:prd tagged block
	const prdBlockRegex = /```json:prd\s*([\s\S]*?)```/g;
	let match;
	const prdBlocks: string[] = [];
	while ((match = prdBlockRegex.exec(text)) !== null) {
		if (match[1]) prdBlocks.push(match[1]);
	}

	for (let i = prdBlocks.length - 1; i >= 0; i--) {
		const candidate = tryParseBlock(prdBlocks[i]);
		if (candidate) return candidate;
	}

	// Strategy 2: Any ```json block that parses as valid PRD (Claude outputs ```json not ```json:prd)
	const jsonBlockRegex = /```(?:json|js)?\s*([\s\S]*?)```/g;
	const jsonBlocks: string[] = [];
	while ((match = jsonBlockRegex.exec(text)) !== null) {
		if (match[1]) jsonBlocks.push(match[1]);
	}

	for (let i = jsonBlocks.length - 1; i >= 0; i--) {
		const candidate = tryParseBlock(jsonBlocks[i]);
		if (candidate) return candidate;
	}

	// Strategy 3: Raw text scan for a full JSON object with appName + sheets
	const lastAppNameIdx = text.lastIndexOf('"appName"');
	if (lastAppNameIdx !== -1 && text.includes('"sheets"')) {
		const b1 = text.lastIndexOf('{', lastAppNameIdx);
		const b2 = text.lastIndexOf('}');
		if (b1 !== -1 && b2 !== -1 && b2 > b1) {
			const candidate = tryParseBlock(text.substring(b1, b2 + 1));
			if (candidate) return candidate;
		}
	}

	return null;
}

function tryParseBlock(raw: string): PRDSpec | null {
	const b1 = raw.indexOf('{');
	const b2 = raw.lastIndexOf('}');
	if (b1 === -1 || b2 === -1 || b2 <= b1) return null;
	try {
		const parsed = JSON.parse(raw.substring(b1, b2 + 1));
		if (parsed && parsed.appName && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
			return parsed as PRDSpec;
		}
	} catch {
		// Not valid JSON
	}
	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, apiKey, model, baseUrl } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Messages array is required' }, { status: 400 });
		}

		const effectiveApiKey = apiKey || env.KEY_9ROUTER || process.env.KEY_9ROUTER || env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
		const effectiveModel = model || env.MODEL_9ROUTER || process.env.MODEL_9ROUTER || env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
		const effectiveBaseUrl = baseUrl || env.URL_9ROUTER || process.env.URL_9ROUTER || env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

		// GATE: only allow PRD extraction on confirmed turns
		const isPrdConfirmed = userConfirmedPrd(messages);
		console.log(`[Chat] isPrdConfirmed=${isPrdConfirmed}, messages=${messages.length}`);

		const fullMessages = [
			{ role: 'system', content: SYSTEM_ANALYST_PROMPT },
			...messages.map((m: any) => ({ role: m.role, content: m.content }))
		];

		const responseText = await callDeepSeekChat({
			apiKey: effectiveApiKey,
			baseUrl: effectiveBaseUrl,
			model: effectiveModel,
			messages: fullMessages,
			temperature: 0.3
		});

		// PRD extraction is GATED - never extract unless user confirmed
		let extractedPrd: PRDSpec | null = null;
		if (isPrdConfirmed) {
			extractedPrd = extractPrdFromText(responseText);
			if (!extractedPrd) {
				console.warn('[PRD] Confirmed but AI did not produce a parseable json:prd block');
			}
		}

		return json({
			content: responseText,
			prd: extractedPrd,
			suggestedReplies: []
		});
	} catch (error: any) {
		console.error('Chat API error:', error);
		return json({ error: error.message || 'Server error' }, { status: 500 });
	}
};
