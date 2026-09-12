import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { callDeepSeekChat } from '$lib/server/deepseek';
import type { PRDSpec, GASFile } from '$lib/types';

function parseImprovedFiles(content: string, existingFiles: GASFile[]): {
	updatedFiles: GASFile[];
	modifiedNames: string[];
	explanation: string;
} {
	const boundaryRegex = /===\s*FILE:\s*([a-zA-Z0-9_.-]+)\s*===\s*([\s\S]*?)(?=(?:===\s*FILE:|$))/gi;
	let match;
	const modifiedMap = new Map<string, GASFile>();

	// Extract explanation before the first boundary marker
	const firstBoundaryIndex = content.indexOf('=== FILE:');
	const explanation = firstBoundaryIndex > 0 
		? content.slice(0, firstBoundaryIndex).trim() 
		: 'Kode berhasil diperbarui sesuai instruksi.';

	while ((match = boundaryRegex.exec(content)) !== null) {
		const rawName = match[1].trim();
		let rawSource = match[2].trim();

		// Clean outer markdown code blocks if wrapped
		rawSource = rawSource.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();

		let name = rawName;
		let type: 'SERVER_JS' | 'HTML' | 'JSON' = 'SERVER_JS';

		if (rawName.endsWith('.json') || rawName.toLowerCase() === 'appsscript') {
			name = 'appsscript';
			type = 'JSON';
		} else if (rawName.endsWith('.html') || rawName.toLowerCase() === 'index') {
			name = rawName.replace('.html', '');
			type = 'HTML';
		} else if (rawName.endsWith('.gs') || rawName.endsWith('.js')) {
			name = rawName.replace(/\.(gs|js)$/, '');
			type = 'SERVER_JS';
		}

		const cleanKey = name.toLowerCase().replace(/\.(html|gs|js|json)$/i, '');
		if (rawSource.length > 20) {
			modifiedMap.set(cleanKey, { name, type, source: rawSource });
		}
	}

	const modifiedNames: string[] = [];
	const updatedFiles: GASFile[] = existingFiles.map((f) => {
		const key = f.name.toLowerCase().replace(/\.(html|gs|js|json)$/i, '');
		if (modifiedMap.has(key)) {
			modifiedNames.push(f.name);
			const updated = modifiedMap.get(key)!;
			modifiedMap.delete(key);
			return updated;
		}
		return f;
	});

	// Any newly introduced files
	for (const [, newFile] of modifiedMap) {
		modifiedNames.push(newFile.name);
		updatedFiles.push(newFile);
	}

	// Deduplicate updatedFiles by normalized name to guarantee uniqueness
	const dedupeMap = new Map<string, GASFile>();
	for (const f of updatedFiles) {
		const key = f.name.toLowerCase().replace(/\.(html|gs|js|json)$/i, '');
		const existing = dedupeMap.get(key);
		if (!existing || (f.source || '').length >= (existing.source || '').length) {
			dedupeMap.set(key, {
				...f,
				name: f.name.replace(/\.(html|gs|js|json)$/i, '')
			});
		}
	}

	return {
		updatedFiles: Array.from(dedupeMap.values()),
		modifiedNames,
		explanation
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prd, files, instruction, targetFileName } = (await request.json()) as {
			prd?: PRDSpec;
			files: GASFile[];
			instruction: string;
			targetFileName?: string;
		};

		if (!instruction || !instruction.trim()) {
			return json({ error: 'Instruksi perbaikan tidak boleh kosong' }, { status: 400 });
		}

		if (!files || files.length === 0) {
			return json({ error: 'Belum ada file kode yang digenerate untuk diperbaiki' }, { status: 400 });
		}

		// Resolve API Key & Endpoint
		const effectiveApiKey = env.KEY_9ROUTER || process.env.KEY_9ROUTER || env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
		const effectiveModel = env.MODEL_9ROUTER || process.env.MODEL_9ROUTER || env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || 'ngoding';
		const effectiveBaseUrl = env.URL_9ROUTER || process.env.URL_9ROUTER || env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'http://localhost:20128/v1';

		if (!effectiveApiKey) {
			return json({
				error: 'API Key tidak ditemukan. Pastikan KEY_9ROUTER atau DEEPSEEK_API_KEY terpasang di .env'
			}, { status: 500 });
		}

		const targetFocus = targetFileName && targetFileName !== 'all'
			? `FOKUS UTAMA: Perbaiki file '${targetFileName}'. Jangan ubah file lain kecuali mutlak diperlukan.`
			: `Perbaiki atau tambahkan fitur pada file-file yang relevan dengan instruksi pengguna.`;

		const existingFilesStr = files.map(f => {
			const ext = f.type === 'SERVER_JS' ? '.gs' : f.type === 'HTML' ? '.html' : '.json';
			return `=== FILE: ${f.name}${ext} ===\n${f.source}`;
		}).join('\n\n');

		const prdSummary = prd ? `
Aplikasi: ${prd.appName} (${prd.tagline || ''})
Tema UI: ${prd.uiFeatures?.theme || 'Modern'}
Sheets: ${prd.sheets?.map(s => `${s.name} (${s.headers?.join(', ') || ''})`).join('; ')}
` : '';

		const systemPrompt = `Kamu adalah Senior Fullstack Engineer Google Apps Script (GAS) kelas dunia.
Tugas kamu adalah MEMPERBAIKI, MENINGKATKAN, atau MENAMBAH FITUR pada kode Google Apps Script yang sudah ada berdasarkan instruksi user.

ATURAN WAJIB:
1. Tulis kode LENGKAP untuk setiap file yang dimodifikasi. JANGAN menulis placeholder seperti "// kode lama tetap sama", "// TODO", atau snippet terpotong.
2. Gunakan format boundary marker ketat:
=== FILE: [filename.ext] ===
[isi kode lengkap file tersebut]
3. HANYA keluarkan file yang mengalami perubahan atau file baru yang dibutuhkan. File yang tidak terpengaruh tidak perlu ditulis ulang.
4. Pastikan sintaks valid:
   - index.html harus berupa HTML lengkap dari <!DOCTYPE html> hingga </html>
   - Code.gs dan Setup.gs berupa JavaScript Google Apps Script yang valid
5. Berikan ringkasan perubahan 1-2 kalimat di bagian paling awal sebelum marker file pertama.`;

		const userPrompt = `PRD APLIKASI:
${prdSummary}

INSTRUKSI PERBAIKAN DARI PENGGUNA:
"""
${instruction.trim()}
"""

${targetFocus}

KODE APLIKASI SAAT INI:
${existingFilesStr}

Mohon buat perbaikan kodenya sekarang dengan format boundary marker.`;

		console.log(`[Improve] Sending request to AI (${effectiveBaseUrl}) with model ${effectiveModel}...`);

		const aiResponse = await callDeepSeekChat({
			apiKey: effectiveApiKey,
			baseUrl: effectiveBaseUrl,
			model: effectiveModel,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			temperature: 0.2
		});

		const { updatedFiles, modifiedNames, explanation } = parseImprovedFiles(aiResponse, files);

		if (modifiedNames.length === 0) {
			console.warn('[Improve] No boundary markers parsed from AI response:', aiResponse.slice(0, 300));
			return json({
				success: false,
				error: 'AI tidak mengembalikan file dalam format yang dikenali. Coba ulangi instruksi dengan lebih spesifik.',
				rawResponse: aiResponse.slice(0, 500)
			}, { status: 422 });
		}

		console.log(`[Improve] Successfully modified files: ${modifiedNames.join(', ')}`);

		return json({
			success: true,
			files: updatedFiles,
			modifiedFileNames: modifiedNames,
			explanation: explanation.slice(0, 300) || `Berhasil memperbarui ${modifiedNames.join(', ')}.`
		});
	} catch (err: any) {
		console.error('[Improve] API error:', err);
		return json({
			error: err.message || 'Gagal memproses perbaikan kode via AI'
		}, { status: 500 });
	}
};
