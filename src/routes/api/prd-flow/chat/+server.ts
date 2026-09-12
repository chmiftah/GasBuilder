import 'dotenv/config';
import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { callDeepSeekChat } from '$lib/server/deepseek';

function userConfirmedPrdAndFlow(messages: Array<{ role: string; content: string }>): boolean {
	const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
	if (!lastUserMsg) return false;

	const text = lastUserMsg.content.toLowerCase().trim();

	// Explicit token from button
	if (lastUserMsg.content.includes('[KONFIRMASI_SUSUN_PRD]') || lastUserMsg.content.includes('[KONFIRMASI_PRD_FLOW]')) return true;

	const confirmKeywords = [
		'konfirmasi',
		'susun prd', 'buat prd', 'lanjutkan prd', 'generate prd', 'buatkan prd',
		'buat flowchart', 'susun flowchart', 'buat diagram',
		'setuju', 'saya setuju', 'oke lanjut', 'ok lanjut', 'ya lanjut', 'ya sudah',
		'lanjutkan saja', 'langsung saja', 'langsung buat', 'oke saja',
		'boleh', 'oke', 'siap', 'yap', 'yep', 'lanjut', 'next'
	];

	if (text.length <= 10) {
		return confirmKeywords.some((kw) => text.includes(kw));
	}
	const multiWordKeywords = confirmKeywords.filter((kw) => kw.includes(' ') || kw.length > 6);
	return multiWordKeywords.some((kw) => text.includes(kw));
}

function extractFlowchartAndPrd(rawText: string): { flowchart: string | null; prd: string | null } {
	let flowchart: string | null = null;
	let prd: string | null = null;

	// Extract Flowchart using Boundary Marker
	const flowMatch = /===\s*FLOWCHART\s*===([\s\S]*?)(?=(?:===\s*PRD\s*===|$))/i.exec(rawText);
	if (flowMatch && flowMatch[1]) {
		flowchart = flowMatch[1].replace(/^```(?:mermaid)?\n?/, '').replace(/\n?```$/, '').trim();
	} else {
		// Fallback to mermaid code block
		const mermaidBlockMatch = /```mermaid\s*([\s\S]*?)```/i.exec(rawText);
		if (mermaidBlockMatch && mermaidBlockMatch[1]) {
			flowchart = mermaidBlockMatch[1].trim();
		}
	}

	// Extract PRD using Boundary Marker
	const prdMatch = /===\s*PRD\s*===([\s\S]*?)(?=(?:===\s*FLOWCHART\s*===|$))/i.exec(rawText);
	if (prdMatch && prdMatch[1]) {
		prd = prdMatch[1].replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```$/, '').trim();
	} else {
		// Fallback: look for markdown starting with # Product Requirements Document
		const mdMatch = /(#\s+(?:Product Requirements Document|PRD)[\s\S]*)/i.exec(rawText);
		if (mdMatch && mdMatch[1]) {
			prd = mdMatch[1].trim();
		}
	}

	return { flowchart, prd };
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages } = (await request.json()) as {
			messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
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

		const isConfirmed = userConfirmedPrdAndFlow(messages);

		let systemPrompt = '';

		if (!isConfirmed) {
			systemPrompt = `Kamu adalah Principal Solution Architect & Product Lead kelas dunia.
Tugas kamu adalah berdiskusi dengan user tentang aplikasi / sistem apa yang ingin mereka bangun, menganalisis alur bisnisnya, dan mematangkan ide mereka.

ATURAN WAJIB FASE DISKUSI:
1. JANGAN PERNAH menyusun PRD lengkap atau diagram Flowchart Mermaid SEBELUM user memberikan konfirmasi eksplisit (misal 'setuju', 'boleh', atau klik tombol susun).
2. Bersikaplah seperti konsultan sistem berpengalaman: apresiasi ide mereka, tangkap esensi aplikasi, dan tanyakan 2-3 pertanyaan penting yang belum jelas (misal: peran user/aktor, alur proses utama, data yang dicatat, atau integrasi luar).
3. Berikan saran rekomendasi alur terbaik agar sistem mereka kuat dan scalable.
4. Di akhir jawaban, sediakan 2-4 saran balasan cepat dalam tag format [REPLY: saran balasan].
Contoh:
[REPLY: Alur persetujuan 2 tingkat (Manager & HR)]
[REPLY: Tambahkan fitur export laporan PDF & Excel]
[REPLY: Sudah cukup jelas, mari susun PRD & Flowchart!]`;
		} else {
			systemPrompt = `Kamu adalah Principal Solution Architect & Product Lead kelas dunia.
User SUDAH MENYETUJUI ide aplikasi. Sekarang TUGAS UTAMA kamu adalah MENYUSUN PRD LENGKAP dan DIAGRAM FLOWCHART SISTEM MERMAID.JS secara presisi!

ATURAN SINTAKS MERMAID YANG SANGAT KETAT (WAJIB DIPATUHI 100% AGAR TIDAK TERJADI SYNTAX ERROR):
1. JANGAN PERNAH memakai karakter '<' atau '>' di dalam teks label diagram!
   - SALAH: AlertCheck{Stok < Minimum?}
   - BENAR: AlertCheck{"Stok Kurang Dari Minimum?"} atau AlertCheck{Stok Kurang Dari Batas Minimum?}
2. SELALU bungkus teks label dengan tanda petik dua jika memiliki spasi, tanda tanya, tanda kurung, garis miring, atau simbol:
   - CONTOH: Login["Proses Login & Autentikasi"] --> CheckRole{"Apakah Role Admin?"}
   - CONTOH: PosApp["Aplikasi Kasir (Mode Kasir)"] --> PaymentGateway["Integrasi QRIS / EDC"]
3. ID Node harus alfanumerik sederhana tanpa spasi atau karakter aneh (contoh: StartNode, CheckRole, PosDashboard, DBLocal).
4. Jangan pernah menaruh tanda kurung siku '[' atau ']' di dalam teks node.
5. Awali diagram selalu dengan 'graph TD' di baris paling pertama.

FORMAT OUTPUT WAJIB (Gunakan Boundary Markers):

Beri sambutan 1-2 kalimat terlebih dahulu, lalu sertakan dua bagian berikut secara lengkap:

=== FLOWCHART ===
graph TD
    %% Tulis diagram alur sistem dan user flow lengkap menggunakan sintaks Mermaid.js valid
    %% Gunakan node dengan icon emoji, percabangan keputusan {"Teks Keputusan?"}, database [("Teks Database")], dan alur jelas
    Start([🚀 Mulai]) --> Step1["Langkah 1"]
    ...

=== PRD ===
# Product Requirements Document (PRD)

## 1. Executive Summary & Visi Produk
(Ringkasan masalah, solusi, dan tujuan sistem)

## 2. User Personas & Stakeholders
(Aktor sistem, peran, dan tanggung jawab)

## 3. Scope Fitur & Modul Utama
(Daftar fitur detail per modul beserta acceptance criteria)

## 4. Skema Database & Data Model
(Entitas tabel, relasi, dan kolom-kolom penting)

## 5. Alur Logika & State Machine
(Status data dari awal hingga selesai, misal: Draft -> Pending -> Approved)

## 6. Integrasi & Persyaratan Non-Fungsional
(Keamanan, role-based access, performa, notifikasi)

PERINGATAN: Tulis dokumen PRD dan Mermaid flowchart secara LENGKAP dan NYATA, BUKAN placeholder/TODO.`;
		}

		console.log(`[PRD & Flow Chat] Sending to ${effectiveBaseUrl} model=${effectiveModel} (Confirmed: ${isConfirmed})...`);

		const aiResponse = await callDeepSeekChat({
			apiKey: effectiveApiKey,
			baseUrl: effectiveBaseUrl,
			model: effectiveModel,
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages.map((m) => ({ role: m.role, content: m.content }))
			],
			temperature: isConfirmed ? 0.2 : 0.6
		});

		const suggestedReplies = extractSuggestedReplies(aiResponse);
		const cleanMessage = aiResponse.replace(/\[REPLY:\s*[^\]]+\]/g, '').trim();

		let extractedFlow: string | null = null;
		let extractedPrd: string | null = null;

		if (isConfirmed) {
			const res = extractFlowchartAndPrd(aiResponse);
			extractedFlow = res.flowchart;
			extractedPrd = res.prd;
		}

		return json({
			success: true,
			message: cleanMessage,
			suggestedReplies,
			flowchart: extractedFlow,
			prd: extractedPrd,
			isConfirmed
		});
	} catch (error: any) {
		console.error('[PRD & Flow Chat] Error:', error);
		return json({ error: error.message || 'Gagal memproses percakapan AI' }, { status: 500 });
	}
};
