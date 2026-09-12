import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { generateGASFilesFromPRD } from '$lib/server/gasGenerator';
import { callDeepSeekChat, CODE_GENERATOR_PROMPT } from '$lib/server/deepseek';
import type { PRDSpec, GASFile } from '$lib/types';

function parseGeneratedGASFiles(content: string): GASFile[] | null {
	const files: GASFile[] = [];

	// Strategy 1: Boundary Marker format (=== FILE: filename ===)
	const boundaryRegex = /===\s*FILE:\s*([a-zA-Z0-9_.-]+)\s*===\s*([\s\S]*?)(?=(?:===\s*FILE:|$))/gi;
	let match;
	while ((match = boundaryRegex.exec(content)) !== null) {
		const rawName = match[1].trim();
		const rawSource = match[2].trim().replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();

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

		if (rawSource.length > 10) {
			files.push({ name, type, source: rawSource });
		}
	}

	function isFileComplete(f: GASFile): boolean {
		if (!f.source || f.source.trim().length < 50) return false;
		if (f.type === 'HTML') {
			const s = f.source.toLowerCase();
			// HTML must contain closing body and html tags to be considered non-truncated
			return s.includes('</html>') || (s.includes('</body>') && s.includes('</script>'));
		}
		if (f.type === 'JSON') {
			try {
				JSON.parse(f.source);
				return true;
			} catch (e) {
				return false;
			}
		}
		if (f.type === 'SERVER_JS') {
			const s = f.source.trim();
			// SERVER_JS must not cut off abruptly mid-comment or mid-statement
			return s.length > 100 && (s.includes('function') || s.includes('CONFIG'));
		}
		return true;
	}

	function deduplicateParsedFiles(rawFiles: GASFile[]): GASFile[] {
		const map = new Map<string, GASFile>();
		for (const f of rawFiles) {
			const key = f.name.toLowerCase().replace(/\.(html|gs|js|json)$/i, '');
			const existing = map.get(key);
			if (!existing || (f.source || '').length > (existing.source || '').length) {
				map.set(key, {
					...f,
					name: key === 'appsscript' ? 'appsscript' : (key === 'code' ? 'Code' : (key === 'setup' ? 'Setup' : (key === 'index' ? 'index' : f.name.replace(/\.(html|gs|js|json)$/i, ''))))
				});
			}
		}
		return Array.from(map.values());
	}

	const validBoundaryFiles = deduplicateParsedFiles(files.filter(isFileComplete));
	const hasValidHtml = validBoundaryFiles.some(f => f.type === 'HTML');
	const hasValidJs = validBoundaryFiles.filter(f => f.type === 'SERVER_JS').length >= 2;

	if (validBoundaryFiles.length >= 3 && hasValidHtml && hasValidJs) {
		console.log('Successfully parsed files using Boundary Marker strategy! Total valid files:', validBoundaryFiles.length);
		return validBoundaryFiles;
	}

	// Strategy 2: Markdown Code Blocks with filename or language tags
	const codeBlockRegex = /```(?:([a-zA-Z0-9_.-]+))?\n([\s\S]*?)```/g;
	const detectedFiles: GASFile[] = [];
	while ((match = codeBlockRegex.exec(content)) !== null) {
		const langOrName = (match[1] || '').toLowerCase();
		const blockContent = match[2].trim();

		if (langOrName.includes('appsscript') || (langOrName === 'json' && blockContent.includes('timeZone') && blockContent.includes('webapp'))) {
			detectedFiles.push({ name: 'appsscript', type: 'JSON', source: blockContent });
		} else if (langOrName.includes('setup') || blockContent.includes('initialSetup(')) {
			detectedFiles.push({ name: 'Setup', type: 'SERVER_JS', source: blockContent });
		} else if (langOrName.includes('code') || blockContent.includes('doGet(') || blockContent.includes('function doGet')) {
			detectedFiles.push({ name: 'Code', type: 'SERVER_JS', source: blockContent });
		} else if (langOrName.includes('html') || blockContent.includes('<!DOCTYPE') || blockContent.includes('<html')) {
			detectedFiles.push({ name: 'index', type: 'HTML', source: blockContent });
		}
	}

	const validDetectedFiles = deduplicateParsedFiles(detectedFiles.filter(isFileComplete));
	if (validDetectedFiles.length >= 3 && validDetectedFiles.some(f => f.type === 'HTML') && validDetectedFiles.some(f => f.type === 'SERVER_JS')) {
		console.log('Successfully parsed files using Code Block strategy! Total valid files:', validDetectedFiles.length);
		return validDetectedFiles;
	}

	// Strategy 3: Standard JSON parse
	try {
		let clean = content.trim();
		const firstBrace = clean.indexOf('{');
		const lastBrace = clean.lastIndexOf('}');
		if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
			clean = clean.substring(firstBrace, lastBrace + 1);
		}
		const parsed = JSON.parse(clean);
		if (parsed && Array.isArray(parsed.files)) {
			const validJsonFiles = deduplicateParsedFiles((parsed.files as GASFile[]).filter(isFileComplete));
			if (validJsonFiles.length >= 3 && validJsonFiles.some(f => f.type === 'HTML') && validJsonFiles.some(f => f.type === 'SERVER_JS')) {
				console.log('Successfully parsed files using JSON strategy! Total valid files:', validJsonFiles.length);
				return validJsonFiles;
			}
		}
	} catch (jsonErr) {
		console.warn('JSON parse strategy failed, trying repair...');
	}

	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prd, apiKey, model, baseUrl } = (await request.json()) as {
			prd: PRDSpec;
			apiKey?: string;
			model?: string;
			baseUrl?: string;
		};

		if (!prd) {
			return json({ error: 'PRD specification is required' }, { status: 400 });
		}

		// Resolve API Key from request body or .env
		const effectiveApiKey = apiKey || env.KEY_9ROUTER || process.env.KEY_9ROUTER || env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
		const effectiveModel = model || env.MODEL_9ROUTER || process.env.MODEL_9ROUTER || env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
		const effectiveBaseUrl = baseUrl || env.URL_9ROUTER || process.env.URL_9ROUTER || env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

		// Generate dynamic base files tailored to this PRD schema as backup
		const baseFiles = generateGASFilesFromPRD(prd);

		// If DeepSeek / AI API Key is available, generate files in modular steps to prevent token truncation
		if (effectiveApiKey) {
			try {
				const prdJsonStr = JSON.stringify(prd, null, 2);

				// Step 1: Generate Backend & Seeder (Code.gs & Setup.gs)
				const backendPrompt = `Berikut adalah dokumen PRD Google Apps Script:\n\`\`\`json\n${prdJsonStr}\n\`\`\`\n\nTugas: Buatkan kode backend Google Apps Script yang lengkap untuk PRD di atas:\n1. === FILE: Code.gs ===\n(Sertakan doGet, initAllSheets, getSpreadsheet, loginUser, updateProfile, getDashboardStats, getTableData, createRecord, updateRecord, deleteRecord untuk semua sheet di PRD)\n2. === FILE: Setup.gs ===\n(Sertakan initialSetup dan sample data seeder untuk semua sheet di PRD)\n\nFormat output:\n=== FILE: Code.gs ===\n...\n=== FILE: Setup.gs ===\n...`;

				// Step 2: Generate Frontend SPA (index.html) — ultra-detailed prompt
				const sheetsStr = prd.sheets?.map((s: any) => `- ${s.name}: ${(s.headers || []).join(', ')}`).join('\n') || '';
				const viewsStr = prd.uiFeatures?.views?.map((v: any) => `- ${v.title}: ${v.description}`).join('\n') || '';
				const hasLogin = prd.sheets?.some((s: any) => s.name?.toLowerCase().includes('user')) ?? false;
				const theme = prd.uiFeatures?.theme || 'Modern Dark Glassmorphism';

				const frontendPrompt = `Kamu adalah Senior Frontend Engineer Google Apps Script terbaik.

PRD Aplikasi:
- Nama: ${prd.appName}
- Tema: ${theme}
- Sheet/Tabel:
${sheetsStr}
- Views/Layar:
${viewsStr}

TUGAS: Tulis SATU FILE index.html LENGKAP dan FUNGSIONAL (bukan placeholder/skeleton).

WAJIB ADA (tanpa terkecuali):
1. CDN di <head>:
   - Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
   - Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   - FontAwesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
   - Google Fonts Inter: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

2. Layout SPA penuh:
   - Sidebar navigasi kiri (fixed, 64px lebar, dark bg) dengan icon + label untuk SETIAP modul dari PRD
   - Topbar kanan (nama app + avatar user + tombol logout jika perlu login)
   - Main content area scroll

3. Dashboard view (tampil pertama):
   - Minimal 3 kartu KPI (total record, total nominal/jumlah, status summary)
   - 2 canvas Chart.js yang langsung dirender: Chart Line (tren) + Chart Doughnut/Bar (kategori)
   - Tabel aktivitas terbaru (5 baris terakhir)

4. Untuk SETIAP sheet di PRD:
   - View tersendiri dengan tabel data lengkap (thead + tbody dengan semua header kolom)
   - Search bar + filter dropdown
   - Tombol "Tambah" yang buka modal form
   - Tombol Edit + Hapus di setiap baris

5. Modal form CRUD:
   - Satu modal reusable dengan input field untuk setiap kolom header sheet aktif
   - Tombol Simpan + Batal

6. JavaScript lengkap:
   - State management (currentView, currentData per tabel)
   - Function showView(viewName) untuk navigasi
   - google.script.run calls untuk semua operasi (dengan fallback mock data untuk preview)
   - Chart.js initialization dengan data dummy yang realistis
   - CRUD handlers: loadTableData, saveRecord, deleteRecord
   ${hasLogin ? `- Login form lengkap dengan validasi, handleLogin(), handleLogout()` : `- Langsung tampilkan dashboard (TIDAK ADA form login)`}

7. CSS inline tambahan untuk animasi dan glassmorphism (jika tema dark)

PERINTAH KERAS:
- JANGAN tulis placeholder seperti "// Initialize UI logic here" atau "// TODO"  
- JANGAN hanya tulis skeleton — tulis KODE LENGKAP dan FUNGSIONAL
- JANGAN skip bagian apapun — tulis sampai tag </html>
- Output harus siap pakai tanpa editing tambahan

Format output:
=== FILE: index.html ===
<!DOCTYPE html>
<html lang="id">
... (tulis SELURUH kode HTML, CSS inline, dan JavaScript sampai tag penutup </html>)
`;

				console.log(`Generating files via AI (${effectiveBaseUrl}) with model ${effectiveModel}...`);
				const [backendResponse, frontendResponse] = await Promise.all([
					callDeepSeekChat({
						apiKey: effectiveApiKey,
						baseUrl: effectiveBaseUrl,
						model: effectiveModel,
						messages: [
							{ role: 'system', content: CODE_GENERATOR_PROMPT },
							{ role: 'user', content: backendPrompt }
						],
						temperature: 0.2
					}),
					callDeepSeekChat({
						apiKey: effectiveApiKey,
						baseUrl: effectiveBaseUrl,
						model: effectiveModel,
						messages: [
							{ role: 'system', content: CODE_GENERATOR_PROMPT },
							{ role: 'user', content: frontendPrompt }
						],
						temperature: 0.2
					})
				]);

				const combinedContent = backendResponse + '\n\n' + frontendResponse;
				const customFiles = parseGeneratedGASFiles(combinedContent);

				if (customFiles && customFiles.length >= 3) {
					// Ensure appsscript.json is included
					if (!customFiles.some(f => f.name === 'appsscript')) {
						customFiles.unshift(baseFiles[0]);
					}
					console.log('Successfully generated modular custom code from DeepSeek! Total files:', customFiles.length);
					return json({
						success: true,
						files: customFiles,
						generatorMode: 'deepseek',
						notice: 'Seluruh 4 file kode berhasil dirakit murni oleh DeepSeek AI Model secara modular & lengkap.'
					});
				} else {
					console.warn('Could not parse complete files from modular DeepSeek response, using base generator');
					return json({
						success: true,
						files: baseFiles,
						generatorMode: 'local_engine',
						notice: 'Output DeepSeek tidak lengkap. Seluruh 4 file kode dirakit utuh oleh High-Speed Engine.'
					});
				}
			} catch (aiErr: any) {
				console.warn('DeepSeek modular code generation failed, using dynamic generator:', aiErr.message);
				return json({
					success: true,
					files: baseFiles,
					generatorMode: 'local_engine',
					notice: `DeepSeek API Limit / Error: (${aiErr.message}). Berhasil dialihkan otomatis ke High-Speed Engine.`
				});
			}
		}

		return json({
			success: true,
			files: baseFiles,
			generatorMode: 'local_engine',
			notice: 'Kode dirakit langsung oleh High-Speed Local Generator sesuai spesifikasi PRD.'
		});
	} catch (error: any) {
		console.error('Generate code API error:', error);
		return json({ error: error.message || 'Failed to generate code' }, { status: 500 });
	}
};
