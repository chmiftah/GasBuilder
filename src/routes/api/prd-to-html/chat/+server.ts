import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { callDeepSeekChat } from '$lib/server/deepseek';

function extractHtmlCode(raw: string): string | null {
	// 1. Boundary marker === HTML ===
	const markerMatch = /===\s*HTML\s*===([\s\S]*?)(?=(?:===\s*PRD\s*===|$))/i.exec(raw);
	if (markerMatch && markerMatch[1]) {
		let c = markerMatch[1].replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
		const docIdx = c.indexOf('<!DOCTYPE html');
		if (docIdx !== -1) {
			const endIdx = c.lastIndexOf('</html>');
			if (endIdx !== -1) return c.substring(docIdx, endIdx + 7).trim();
			return c.substring(docIdx).trim();
		}
		return c;
	}

	// 2. Fallback to html code block
	const codeBlockMatch = /```(?:html)?\s*([\s\S]*?)```/i.exec(raw);
	if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].includes('<html')) {
		let c = codeBlockMatch[1].trim();
		const docIdx = c.indexOf('<!DOCTYPE html');
		if (docIdx !== -1) {
			const endIdx = c.lastIndexOf('</html>');
			if (endIdx !== -1) return c.substring(docIdx, endIdx + 7).trim();
			return c.substring(docIdx).trim();
		}
		return c;
	}

	return null;
}

function extractPrdDoc(raw: string): string | null {
	const markerMatch = /===\s*PRD\s*===([\s\S]*?)(?=(?:===\s*HTML\s*===|$))/i.exec(raw);
	if (markerMatch && markerMatch[1]) {
		return markerMatch[1].replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```$/, '').trim();
	}

	const mdMatch = /(#\s+(?:Product Requirements Document|PRD)[\s\S]*?)(?=(?:===\s*HTML\s*===|```html|$))/i.exec(raw);
	if (mdMatch && mdMatch[1]) {
		return mdMatch[1].trim();
	}

	return null;
}

function extractSuggestedReplies(text: string): string[] {
	const regex = /\[REPLY:\s*([^\]]+)\]/g;
	const replies: string[] = [];
	let match;
	while ((match = regex.exec(text)) !== null) {
		replies.push(match[1].trim());
	}
	return replies.slice(0, 4);
}

function extractDesignRead(raw: string): string {
	const match = /<!--\s*DESIGN READ:\s*([^\n>]+)-->/i.exec(raw);
	if (match && match[1]) {
		return match[1].trim();
	}
	const lineMatch = /(?:Reading this as|Design Read)[:\s]+([^\n]+)/i.exec(raw);
	if (lineMatch && lineMatch[1]) {
		return lineMatch[1].trim();
	}
	return 'Anti-Slop Modern Web Architecture';
}

function shouldGenerateOrRevise(lastMsg: string, hasExistingHtml: boolean): { isGenerateAction: boolean; isRevisionAction: boolean } {
	const text = lastMsg.toLowerCase();

	if (lastMsg.includes('[KONFIRMASI_GENERATE_HTML]') || lastMsg.includes('[GENERATE_HTML]')) {
		return { isGenerateAction: true, isRevisionAction: false };
	}

	const generateKeywords = [
		'buatkan sekarang', 'buat sekarang', 'generate sekarang', 'susun sekarang',
		'generate html', 'buat html', 'buatkan html', 'susun html',
		'generate landing page', 'buat landing page', 'generate dashboard', 'buat dashboard',
		'setuju, buat', 'mari buat', 'lanjutkan buat', 'langsung buat'
	];

	if (generateKeywords.some((kw) => text.includes(kw))) {
		return { isGenerateAction: true, isRevisionAction: false };
	}

	if (hasExistingHtml) {
		const revisionKeywords = [
			'ubah', 'ganti', 'tambahkan', 'tambah', 'perbaiki', 'revisi', 'hapus', 'kurangi',
			'warna', 'font', 'section', 'hero', 'tabel', 'chart', 'grafik', 'faq', 'footer',
			'nav', 'tombol', 'cta', 'perbesar', 'perkecil', 'gaya', 'improve', 'update'
		];
		if (revisionKeywords.some((kw) => text.includes(kw))) {
			return { isGenerateAction: false, isRevisionAction: true };
		}
	}

	return { isGenerateAction: false, isRevisionAction: false };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, pageType, vibe, currentHtml, currentPrd, customInstructions } = (await request.json()) as {
			messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
			pageType?: 'dashboard' | 'landing';
			vibe?: string;
			currentHtml?: string;
			currentPrd?: string;
			customInstructions?: string;
		};

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return json({ error: 'Messages are required' }, { status: 400 });
		}

		// Resolve API Key and Model from .env
		const effectiveApiKey = env.KEY_9ROUTER || process.env.KEY_9ROUTER || env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
		const effectiveModel = env.MODEL_9ROUTER || process.env.MODEL_9ROUTER || env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || 'ngoding';
		const effectiveBaseUrl = env.URL_9ROUTER || process.env.URL_9ROUTER || env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'http://localhost:20128/v1';

		if (!effectiveApiKey) {
			return json({
				error: 'API Key tidak ditemukan. Pastikan KEY_9ROUTER atau DEEPSEEK_API_KEY terpasang di .env'
			}, { status: 500 });
		}

		const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
		const hasHtml = Boolean(currentHtml && currentHtml.length > 200);
		const { isGenerateAction, isRevisionAction } = shouldGenerateOrRevise(lastUserMsg, hasHtml);

		const selectedType = pageType === 'dashboard' ? 'Dashboard Aplikasi (SaaS / Web App)' : 'Landing Page (Marketing & Product Presentation)';
		const selectedVibe = vibe || 'Linear-Style Dark Tech';

		let systemPrompt = '';

		if (isRevisionAction && hasHtml) {
			// REVISION PHASE: User wants to tweak/improve existing HTML
			systemPrompt = `Kamu adalah Principal Frontend Design Engineer & Taste Architect kelas dunia.
Pengguna meminta kamu untuk MERIVISI / MENG-IMPROVE halaman HTML yang sudah ada berdasarkan instruksi chat mereka.

TIPE HALAMAN: ${selectedType}
ESTETIKA / VIBE: ${selectedVibe}

KODE HTML SAAT INI:
\`\`\`html
${currentHtml}
\`\`\`

ATURAN REVISI KETAT (BERPEDOMAN PADA ANTI-SLOP FRONTEND DESIGN TASTE DARI SKILL.MD):
1. Pahami bagian mana yang diminta untuk diubah atau ditambahkan (misal: warna aksen, section FAQ baru, grafik Chart.js, atau penataan tabel).
2. Pertahankan keutuhan halaman HTML mandiri (<!DOCTYPE html>, Tailwind Play CDN, Phosphor Icons, Google Fonts Geist/Outfit, Alpine.js, Chart.js jika dashboard).
3. 🚫 Tetap hindari AI-slop: Kontras WCAG AA wajib terpenuhi, jangan gunakan AI-purple glow klise, jangan gunakan em-dash dekoratif, dan teks tombol tidak boleh wrapping.
4. Di awal respon, jelaskan secara singkat (1-2 kalimat ramah) apa saja perubahan/peningkatan yang kamu lakukan.
5. Format output:
Jelaskan perubahan 1-2 kalimat, lalu sertakan kode HTML utuh yang sudah direvisi di dalam boundary marker:

=== HTML ===
<!DOCTYPE html>
<html lang="id" class="dark">
...
</html>

Di akhir, berikan 2-3 saran perbaikan lanjutan dalam format [REPLY: saran revisi berikutnya].`;
		} else if (isGenerateAction) {
			// GENERATION PHASE: User explicitly confirmed to build full PRD and HTML
			systemPrompt = `Kamu adalah Principal Frontend Design Engineer & Taste Architect kelas dunia.
Pengguna telah menyetujui ide aplikasi dan MEMINTA KAMU MENYUSUN PRD LENGKAP DAN MENGHASILKAN KODE STANDALONE HTML + TAILWIND CSS YANG MEMUKAU, TIDAK TEMPLATED, DAN BEBAS DARI "AI SLOP".

TIPE HALAMAN: ${selectedType}
ESTETIKA / VIBE: ${selectedVibe}
${currentPrd ? `PRD REFERENSI: \n${currentPrd}\n` : ''}

ATURAN ANTI-SLOP (SKILL.MD DIRECTIVES):
1. BRIEF & DESIGN READ:
Awali kode HTML kamu dengan komentar satu baris di paling atas:
<!-- DESIGN READ: <page kind> for <target audience>, with a <vibe> language, 1 locked accent color, and <font pairing> -->
2. 🚫 DILARANG KERAS: AI Purple / Lila mesh glow, 3 kartu fitur identik berjajar, fake screenshot div, tombol teks terpotong (wrapping), dan em-dash dekoratif.
3. ✅ WAJIB: Kontras WCAG AA, 1 warna aksen terkunci, Google Fonts modern (Geist / Outfit), Phosphor Icons CDN, Alpine.js untuk interaksi, dan Chart.js jika dashboard.
4. Tuliskan kode HTML LENGKAP dan SELESAI (tanpa TODO / placeholder).

FORMAT OUTPUT WAJIB:
Beri sambutan 1-2 kalimat, lalu sertakan dua bagian berikut secara lengkap:

=== PRD ===
# Product Requirements Document (PRD)
## 1. Executive Summary & Visi Produk
...
## 2. User Personas & Kebutuhan Utama
...
## 3. Scope Fitur & Modul
...

=== HTML ===
<!DOCTYPE html>
<html lang="id" class="dark">
...
</html>

Di akhir, sertakan 2-3 opsi revisi/eksplorasi dalam tag [REPLY: saran perbaikan lanjutan].`;
		} else {
			// DISCOVERY & CONSULTATION PHASE: Discussing ideas, suggesting architecture & PRD draft
			systemPrompt = `Kamu adalah Principal Solution Architect & Product Lead kelas dunia.
Pengguna sedang berdiskusi dengan kamu mengenai ide aplikasi atau website apa yang ingin mereka buat (pilihan: ${selectedType}).

TUGAS KAMU DI FASE KONSULTASI INI:
1. Apresiasi ide mereka, tangkap inti bisnis & penggunanya.
2. Berikan 2-3 saran fitur kunci bernilai tinggi yang membuat aplikasinya profesional dan tidak pasaran.
3. Tanyakan 1-2 pertanyaan klarifikasi penting (misal: gaya tema, fitur unik, atau integrasi).
4. Rumuskan Draf Ringkas PRD di dalam marker:
=== PRD ===
# PRD: [Nama Aplikasi / Sistem]
## 1. Visi Produk
...
## 2. Fitur Kunci
...
5. Di akhir jawaban, sediakan 2-4 saran balasan cepat dalam tag format [REPLY: saran balasan], termasuk tombol konfirmasi:
Contoh:
[REPLY: Tambahkan fitur export PDF & Excel]
[REPLY: Konsep sudah pas! Mari buatkan sekarang]`;
		}

		console.log(`[PRD to HTML Chat] Mode: ${isRevisionAction ? 'REVISION' : isGenerateAction ? 'GENERATE' : 'CONSULTATION'}, Model: ${effectiveModel}...`);

		const aiResponse = await callDeepSeekChat({
			apiKey: effectiveApiKey,
			baseUrl: effectiveBaseUrl,
			model: effectiveModel,
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages.map((m) => ({ role: m.role, content: m.content }))
			],
			temperature: isGenerateAction || isRevisionAction ? 0.25 : 0.6
		});

		const suggestedReplies = extractSuggestedReplies(aiResponse);
		const cleanMessage = aiResponse
			.replace(/===\s*HTML\s*===[\s\S]*?(?=(?:===\s*PRD\s*===|$))/i, '')
			.replace(/===\s*PRD\s*===[\s\S]*?(?=(?:===\s*HTML\s*===|$))/i, '')
			.replace(/\[REPLY:\s*[^\]]+\]/g, '')
			.trim();

		const extractedHtml = extractHtmlCode(aiResponse);
		const extractedPrd = extractPrdDoc(aiResponse);
		const designRead = extractedHtml ? extractDesignRead(extractedHtml) : undefined;

		return json({
			success: true,
			message: cleanMessage || 'Tanggapan telah diproses.',
			html: extractedHtml || undefined,
			prd: extractedPrd || undefined,
			designRead,
			suggestedReplies,
			actionType: isRevisionAction ? 'revision' : isGenerateAction ? 'generate' : 'consultation'
		});
	} catch (err: any) {
		console.error('[PRD to HTML Chat Error]:', err);
		return json({
			error: err.message || 'Terjadi kesalahan saat berkomunikasi dengan AI'
		}, { status: 500 });
	}
};
