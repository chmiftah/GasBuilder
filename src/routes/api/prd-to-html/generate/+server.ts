import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { callDeepSeekChat } from '$lib/server/deepseek';

function extractHtmlCode(raw: string): string {
	let code = raw.trim();

	// Match html code block
	const codeBlockMatch = /```(?:html)?\s*([\s\S]*?)```/i.exec(code);
	if (codeBlockMatch && codeBlockMatch[1]) {
		code = codeBlockMatch[1].trim();
	}

	// If missing <!DOCTYPE html>, find where <html> or <!DOCTYPE starts
	const docTypeIndex = code.indexOf('<!DOCTYPE html');
	if (docTypeIndex !== -1) {
		const endIndex = code.lastIndexOf('</html>');
		if (endIndex !== -1) {
			code = code.substring(docTypeIndex, endIndex + 7);
		} else {
			code = code.substring(docTypeIndex);
		}
	} else {
		const htmlTagIndex = code.indexOf('<html');
		if (htmlTagIndex !== -1) {
			const endIndex = code.lastIndexOf('</html>');
			if (endIndex !== -1) {
				code = '<!DOCTYPE html>\n' + code.substring(htmlTagIndex, endIndex + 7);
			} else {
				code = '<!DOCTYPE html>\n' + code.substring(htmlTagIndex);
			}
		}
	}

	return code.trim();
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prdContent, pageType, vibe, customInstructions } = (await request.json()) as {
			prdContent: string;
			pageType?: 'dashboard' | 'landing';
			vibe?: string;
			customInstructions?: string;
		};

		if (!prdContent || typeof prdContent !== 'string' || !prdContent.trim()) {
			return json({ error: 'PRD Content atau spesifikasi aplikasi wajib diisi.' }, { status: 400 });
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

		const selectedType = pageType === 'dashboard' ? 'Dashboard Aplikasi (SaaS / Web App)' : 'Landing Page (Marketing & Product Presentation)';
		const selectedVibe = vibe || 'Linear-Style Dark Tech';

		const systemPrompt = `Kamu adalah Principal Frontend Design Engineer & Taste Architect kelas dunia.
Tugas kamu adalah MENGUBAH DOKUMEN PRD (Product Requirements Document) MENJADI KODE STANDALONE HTML + TAILWIND CSS YANG SANGAT MEMUKAU, TIDAK TEMPLATED, DAN BEBAS DARI "AI SLOP".

Kamu berpedoman 100% pada prinsip ANTI-SLOP FRONTEND DESIGN TASTE:

1. BRIEF & DESIGN READ:
Awali kode HTML kamu dengan komentar satu baris di paling atas:
<!-- DESIGN READ: <page kind> for <target audience>, with a <vibe> language, 1 locked accent color, and <font pairing> -->

2. ATURAN ANTI-SLOP (PRE-FLIGHT RULES):
- 🚫 DILARANG KERAS: AI Purple / Lila mesh glow, gradien ungu neon klise, 3 kotak fitur berjejer identik yang membosankan.
- 🚫 DILARANG KERAS: Centered hero cliché (H1 besar di tengah dengan tombol glow ungu dan 3 kartu di bawahnya).
- 🚫 DILARANG KERAS: Fake div screenshots (kotak-kotak div tiruan dashboard palsu yang tidak interaktif).
- 🚫 DILARANG KERAS: Em-dash (—) sebagai hiasan teks atau bullet.
- 🚫 DILARANG KERAS: Tombol dengan teks terpotong/wrapping (contoh "VIEW SELECTED WORK" terpecah 2 baris). Teks tombol harus 1 baris jelas dan padat.
- 🚫 DILARANG: Eyebrow berlebihan. Maksimal 1 label huruf kapital kecil (eyebrow) per 3 section.
- ✅ WAJIB: Kontras teks tombol & form memenuhi standar WCAG AA (jangan teks putih di latar putih, jangan abu-abu tipis tanpa kontras).
- ✅ WAJIB: Kunci 1 warna aksen dominan per halaman (misal Emerald #10b981, Electric Blue #0284c7, Amber #f59e0b, atau Rose #f43f5e) dipadukan dengan neutral Slate / Zinc / Neutral yang harmonis.
- ✅ WAJIB: Shape consistency lock (pilih konsisten apakah rounded-xl atau rounded-2xl atau pill).

3. TECH STACK FILE STANDALONE HTML:
Hasilkan 1 file HTML utuh (valid <!DOCTYPE html>) yang menggunakan CDN berikut di dalam <head>:
a. Tailwind Play CDN:
   <script src="https://cdn.tailwindcss.com"></script>
   Konfigurasikan tailwind.config di dalam script tersendiri untuk font dan warna kustom jika diperlukan.
b. Google Fonts Modern (Bukan Inter biasa, gunakan Geist, Outfit, atau Plus Jakarta Sans):
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
c. Phosphor Icons CDN:
   <script src="https://unpkg.com/@phosphor-icons/web"></script>
   Gunakan tag <i class="ph ph-nama-icon"></i> atau <i class="ph-bold ph-nama-icon"></i>.
d. Alpine.js CDN (untuk interaktivitas ringan, reactive state, tab switcher, modal, dropdown):
   <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
${selectedType.includes('Dashboard') ? `e. Chart.js CDN (WAJIB ADA untuk Dashboard):
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   Buat grafik analitik nyata dengan dataset yang relevan terhadap PRD (Line area chart bergradien halus, bar metric, status pie) yang diinisialisasi secara rapi di script bawah.` : ''}

4. PERSYARATAN STRUKTUR:
${selectedType.includes('Dashboard') ? `
UNTUK DASHBOARD APLIKASI:
- Sidebar navigasi modern (Logo aplikasi, menu aktif beraksen, status role user di bawah, collapsible/responsive).
- Topbar rapi (Breadcrumb dinamis, search bar dengan shortcut, notifikasi badge, profile dropdown).
- Header workspace dengan Title & Action CTA (misal "+ Tambah Transaksi", "Export Laporan").
- Row KPI Metrics Cards dengan angka nyata, indikator tren (+12.4% vs last month), dan visual sparkline/icon.
- Chart Section interaktif (Chart.js analitik tren dan distribusi status).
- Table Data Section fungsional (Tab filter status, search input, status badge, pagination, action dropdown).
- Modal / Slide-over Drawer detail yang bisa dibuka menggunakan Alpine.js (x-data, @click).
` : `
UNTUK LANDING PAGE:
- Sticky modern navigation bar dengan brand mark, links, dan primary action CTA.
- Hero Section asimetris / 50-50 split atau visual asset nyata (Bukan sekadar teks polos di tengah).
- Social Proof / Logo Wall nyata (menggunakan Simple Icons atau SVG wordmark elegan).
- Bento Grid Feature Section dengan ritme asimetris (kartu hero lebar dipadukan dengan kartu vertikal & aksen visual).
- Interactive Live Product / Workflow Preview interaktif (digerakkan oleh Alpine.js tabs/steps).
- Testimonial / Social Impact Section bernas (maksimal 3 baris quote, nama + peran).
- Conversion CTA Section berdaya pikat tinggi dengan form input / direct button.
- Clean Footer dengan legal, links, and system status indicator.
`}

5. OUTPUT FORMAT:
Berikan HANYA kode HTML lengkap di dalam satu blok markdown:
\`\`\`html
<!DOCTYPE html>
<html lang="id" class="dark">
...
</html>
\`\`\`
DILARANG memberikan potongan kode atau instruksi "lanjutkan di sini / TODO". Tuliskan kode SELESAI dan BISA LANGSUNG DIJALANKAN!`;

		const userMessage = `Tipe Halaman: ${selectedType}
Gaya Estetika / Vibe: ${selectedVibe}
${customInstructions ? `Instruksi Khusus: ${customInstructions}` : ''}

DOKUMEN PRD / SPESIFIKASI:
${prdContent}

Buatkan halaman standalone HTML + Tailwind CDN + Phosphor Icons + Alpine.js ${selectedType.includes('Dashboard') ? '+ Chart.js' : ''} sekarang!`;

		console.log(`[PRD to HTML] Generating ${selectedType} (${selectedVibe}) via ${effectiveBaseUrl} model=${effectiveModel}...`);

		const aiResponse = await callDeepSeekChat({
			apiKey: effectiveApiKey,
			baseUrl: effectiveBaseUrl,
			model: effectiveModel,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage }
			],
			temperature: 0.3
		});

		const designRead = extractDesignRead(aiResponse);
		const htmlCode = extractHtmlCode(aiResponse);

		if (!htmlCode || htmlCode.length < 100) {
			throw new Error('AI tidak mengembalikan kode HTML yang valid. Silakan coba kembali.');
		}

		return json({
			success: true,
			designRead,
			html: htmlCode,
			pageType: pageType || 'landing'
		});
	} catch (err: any) {
		console.error('[PRD to HTML Error]:', err);
		return json({
			error: err.message || 'Terjadi kesalahan saat memproses PRD ke HTML'
		}, { status: 500 });
	}
};
