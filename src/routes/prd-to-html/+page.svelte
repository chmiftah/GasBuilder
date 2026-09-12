<script lang="ts">
	import { 
		ArrowLeft, 
		LayoutTemplate, 
		Sparkles, 
		Download, 
		Copy, 
		Check, 
		ExternalLink, 
		RefreshCw, 
		Code2, 
		Eye, 
		Layers, 
		Rocket, 
		Cpu, 
		Smartphone, 
		Tablet, 
		Monitor, 
		FileText, 
		CheckCircle2, 
		SlidersHorizontal, 
		ChevronDown,
		Wand2,
		AlertCircle,
		Send,
		Bot,
		User,
		MessageSquare,
		CornerDownLeft,
		Paintbrush,
		BarChart3,
		HelpCircle
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface ChatMsg {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: string;
		suggestedReplies?: string[];
		actionType?: 'consultation' | 'generate' | 'revision';
	}

	// State
	let pageType = $state<'dashboard' | 'landing'>('dashboard');
	let selectedVibe = $state<string>('Linear-Style Dark Tech');
	let customInstructions = $state<string>('');
	let showAdvanced = $state(false);

	let leftTab = $state<'chat' | 'prd'>('chat');
	let activeTab = $state<'preview' | 'code'>('preview');
	let viewportMode = $state<'desktop' | 'tablet' | 'mobile'>('desktop');

	let inputMessage = $state<string>('');
	let isSending = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let errorMessage = $state<string>('');

	let chatContainer: HTMLElement | null = $state(null);

	let prdInput = $state<string>(`# Product Requirements Document (PRD)

## 1. Executive Summary & Visi Produk
Sistem Kasir Pintar (Cloud POS) dan Manajemen Multi-Outlet Kafe. Dirancang untuk transaksi kasir kilat, sinkronisasi stok realtime ke dapur, dan pelaporan keuangan harian bagi pemilik usaha.

## 2. User Personas
- **Kasir**: Melayani pemesanan cepat, input pesanan dengan custom opsi, menerima QRIS/Tunai, cetak struk.
- **Koki / Barista**: Memantau antrean pesanan via Kitchen Display System (KDS), ubah status memasak.
- **Owner / Manager**: Pantau analitik omzet per cabang, rekap produk terlaris, dan alert batas minimum stok.

## 3. Scope Fitur & Modul Utama
1. **Dashboard Metrik**: Total Penjualan Hari Ini, Rata-rata Nilai Transaksi, Jumlah Order Aktif, dan Margin Keuntungan.
2. **Katalog Produk & Kasir**: Kategori menu (Kopi, Non-Kopi, Makanan, Pastry), tombol cepat, varian ukuran/es/gula.
3. **Grafik Penjualan**: Tren omzet per jam dan perbandingan performa antar cabang.
4. **Tabel Riwayat Transaksi**: No. Order, Waktu, Pelanggan, Kasir, Metode Bayar, Nominal, dan Status.
5. **Stok Minimum Alert**: Notifikasi langsung jika persediaan bahan di bawah batas aman.`);

	let generatedHtml = $state<string>('');
	let designRead = $state<string>('');

	// Chat history
	let messages = $state<ChatMsg[]>([
		{
			id: 'welcome',
			role: 'assistant',
			content: 'Halo! Saya AI Frontend Taste Architect. Anda ingin membangun Dashboard Aplikasi atau Landing Page apa hari ini? Ceritakan ide Anda atau pilih template, lalu kita bisa berdiskusi, menyusun PRD, dan langsung merakit halamannya. Jika halaman sudah jadi, Anda juga bisa meminta saya merevisi atau meng-improve elemen tertentu!',
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			suggestedReplies: [
				'Buatkan Cloud POS Kafe & Manajemen Outlet',
				'Buatkan Portal Absensi & Cuti Karyawan',
				'Buatkan Landing Page SaaS Cloud DevTools'
			]
		}
	]);

	const STORAGE_KEY = 'prd_to_html_builder_chat_v1';

	const VIBE_OPTIONS = [
		{ id: 'Linear-Style Dark Tech', label: 'Linear-Style Dark Tech', desc: 'Minimalis modern gelap, aksen electric blue/emerald, kontras tajam' },
		{ id: 'Modern Clean B2B', label: 'Modern Clean B2B', desc: 'Sleek slate-900, border presisi, kartu metrik berbobot nyata' },
		{ id: 'Minimalist Editorial', label: 'Minimalist Editorial', desc: 'Tipografi berkarakter, ruang bernapas luas, visual berwibawa' },
		{ id: 'Consumer Premium', label: 'Consumer Premium', desc: 'Warna taktil alami, aksen amber/rose hangat, elegan' }
	];

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 80);
	}

	function loadSamplePrd(type: 'pos' | 'hr' | 'saas') {
		if (type === 'pos') {
			pageType = 'dashboard';
			handleSendChatMessage('Saya ingin membuat Dashboard Aplikasi Kasir Kafe Modern (Cloud POS) dengan metrik omzet, grafik penjualan per jam, dan tabel riwayat transaksi.');
		} else if (type === 'hr') {
			pageType = 'dashboard';
			handleSendChatMessage('Saya ingin membuat Dashboard Portal HR Internal untuk absensi geolocation karyawan, permohonan cuti, dan persetujuan manajer.');
		} else {
			pageType = 'landing';
			handleSendChatMessage('Saya ingin membuat Landing Page modern untuk produk SaaS Cloud DevTools dengan split hero, bento grid 5 fitur, dan kalkulator harga.');
		}
	}

	function saveState() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				messages,
				prdInput,
				pageType,
				selectedVibe,
				customInstructions,
				generatedHtml,
				designRead
			}));
		} catch (e) {}
	}

	function loadState() {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const data = JSON.parse(raw);
				if (data.messages && data.messages.length > 0) messages = data.messages;
				if (data.prdInput) prdInput = data.prdInput;
				if (data.pageType) pageType = data.pageType;
				if (data.selectedVibe) selectedVibe = data.selectedVibe;
				if (data.customInstructions) customInstructions = data.customInstructions;
				if (data.generatedHtml) {
					generatedHtml = data.generatedHtml;
					designRead = data.designRead || '';
				}
			}
		} catch (e) {}
	}

	async function handleSendChatMessage(overrideText?: string) {
		const text = (overrideText || inputMessage).trim();
		if (!text || isSending) return;

		const userMsg: ChatMsg = {
			id: 'msg-' + Date.now(),
			role: 'user',
			content: text,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};

		messages = [...messages, userMsg];
		inputMessage = '';
		isSending = true;
		errorMessage = '';
		scrollToBottom();
		saveState();

		try {
			const res = await fetch('/api/prd-to-html/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.map(m => ({ role: m.role, content: m.content })),
					pageType,
					vibe: selectedVibe,
					currentHtml: generatedHtml || undefined,
					currentPrd: prdInput || undefined,
					customInstructions: customInstructions.trim() || undefined
				})
			});

			const data = await res.json();
			if (data.error) throw new Error(data.error);

			const aiMsg: ChatMsg = {
				id: 'msg-' + (Date.now() + 1),
				role: 'assistant',
				content: data.message || 'Tanggapan telah diproses.',
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				suggestedReplies: data.suggestedReplies || [],
				actionType: data.actionType
			};

			messages = [...messages, aiMsg];

			// If AI formulated/updated PRD
			if (data.prd) {
				prdInput = data.prd;
			}

			// If AI generated or revised the HTML
			if (data.html) {
				generatedHtml = data.html;
				if (data.designRead) designRead = data.designRead;
				activeTab = 'preview';
			}

			saveState();
		} catch (err: any) {
			errorMessage = err.message || 'Gagal berkomunikasi dengan AI';
			messages = [...messages, {
				id: 'msg-' + (Date.now() + 1),
				role: 'assistant',
				content: `⚠️ Terjadi kesalahan: ${err.message || 'Gagal menghubungi server AI'}. Pastikan koneksi atau 9Router aktif.`,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			}];
		} finally {
			isSending = false;
			scrollToBottom();
		}
	}

	function handleConfirmAndGenerate() {
		handleSendChatMessage('[KONFIRMASI_GENERATE_HTML] Saya setuju dengan konsep ini. Tolong susun PRD lengkap dan buatkan kode HTML Anti-Slop sekarang!');
	}

	function copyHtml() {
		if (!generatedHtml) return;
		navigator.clipboard.writeText(generatedHtml);
		copied = true;
		setTimeout(() => copied = false, 2500);
	}

	function downloadHtml() {
		if (!generatedHtml) return;
		const blob = new Blob([generatedHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${pageType}_${Date.now()}.html`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function openInNewTab() {
		if (!generatedHtml) return;
		const blob = new Blob([generatedHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
	}

	function clearSession() {
		if (confirm('Mulai sesi diskusi & perancangan baru? Riwayat chat dan kode saat ini akan di-reset.')) {
			localStorage.removeItem(STORAGE_KEY);
			location.reload();
		}
	}

	onMount(() => {
		loadState();
	});
</script>

<svelte:head>
	<title>PRD to HTML Studio • Anti-Slop Frontend Taste</title>
</svelte:head>

<div class="min-h-screen h-screen flex flex-col bg-[#060913] text-slate-100 font-sans overflow-hidden select-none">
	<!-- Top Header -->
	<header class="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shrink-0">
		<div class="flex items-center space-x-3 sm:space-x-4">
			<a 
				href="/"
				title="Kembali ke App Launcher Hub"
				class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 group">
				<ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
				<span class="hidden sm:inline">Apps Hub</span>
			</a>

			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
					<LayoutTemplate class="w-5 h-5" />
				</div>
				<div>
					<div class="flex items-center space-x-2">
						<h1 class="text-sm font-bold text-white tracking-tight">PRD to HTML Studio</h1>
						<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">AI Taste Studio</span>
					</div>
					<p class="text-[11px] text-slate-400 flex items-center gap-1.5">
						<Sparkles class="w-3 h-3 text-violet-400" /> Diskusi Ide, Susun PRD, & Live Chat Revisi Elemen
					</p>
				</div>
			</div>
		</div>

		<!-- Top Right Actions -->
		<div class="flex items-center space-x-2">
			<button 
				onclick={clearSession}
				title="Mulai ide baru"
				class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition">
				<span>Ide Baru</span>
			</button>

			{#if generatedHtml}
				<button 
					onclick={copyHtml}
					title="Salin Kode HTML"
					class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition">
					{#if copied}
						<Check class="w-4 h-4 text-emerald-400" />
					{:else}
						<Copy class="w-4 h-4" />
					{/if}
				</button>

				<button 
					onclick={openInNewTab}
					title="Buka Halaman Standalone di Tab Baru"
					class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition">
					<ExternalLink class="w-3.5 h-3.5 text-sky-400" />
					<span class="hidden sm:inline">Tab Baru</span>
				</button>

				<button 
					onclick={downloadHtml}
					title="Unduh File .html Mandiri"
					class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-violet-500/20">
					<Download class="w-3.5 h-3.5" />
					<span class="hidden sm:inline">Download .html</span>
				</button>
			{/if}
		</div>
	</header>

	<!-- Main 50/50 Split Grid -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden min-h-0 h-[calc(100vh-4rem)] w-full">
		<!-- LEFT PANEL: AI Chat, PRD Editor, & Controls (50% width) -->
		<section class="h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/70 overflow-hidden min-h-0 min-w-0">
			<!-- Header Controls: Mode Selector & Tabs -->
			<div class="p-3.5 border-b border-slate-800/80 bg-slate-900/40 space-y-3 shrink-0">
				<!-- Choice: Dashboard vs Landing Page -->
				<div class="grid grid-cols-2 gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
					<button 
						onclick={() => pageType = 'dashboard'}
						class="py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition {pageType === 'dashboard' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-400 hover:text-slate-200'}">
						<Layers class="w-3.5 h-3.5" />
						<span>Dashboard Aplikasi</span>
					</button>
					<button 
						onclick={() => pageType = 'landing'}
						class="py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition {pageType === 'landing' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-400 hover:text-slate-200'}">
						<Rocket class="w-3.5 h-3.5" />
						<span>Landing Page</span>
					</button>
				</div>

				<!-- Navigation Tab between Chat and PRD -->
				<div class="flex items-center justify-between text-xs">
					<div class="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
						<button 
							onclick={() => leftTab = 'chat'}
							class="px-3 py-1 rounded transition flex items-center gap-1.5 {leftTab === 'chat' ? 'bg-slate-800 text-violet-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
							<MessageSquare class="w-3.5 h-3.5" />
							<span>AI Chat & Revisi</span>
						</button>
						<button 
							onclick={() => leftTab = 'prd'}
							class="px-3 py-1 rounded transition flex items-center gap-1.5 {leftTab === 'prd' ? 'bg-slate-800 text-violet-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
							<FileText class="w-3.5 h-3.5" />
							<span>Dokumen PRD</span>
						</button>
					</div>

					<div class="flex items-center gap-1 text-[11px]">
						<span class="text-slate-500">Preset:</span>
						<button 
							onclick={() => loadSamplePrd('pos')}
							class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">
							POS Kafe
						</button>
						<button 
							onclick={() => loadSamplePrd('hr')}
							class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">
							HR Portal
						</button>
						<button 
							onclick={() => loadSamplePrd('saas')}
							class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">
							SaaS
						</button>
					</div>
				</div>

				<!-- Aesthetic Vibe Selector -->
				<div>
					<label for="vibe-select" class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Gaya Estetika / Vibe:</label>
					<select 
						id="vibe-select"
						bind:value={selectedVibe}
						class="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 transition">
						{#each VIBE_OPTIONS as opt}
							<option value={opt.id}>{opt.label} — {opt.desc}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Tab 1: AI Chat & Iterative Revision Feed -->
			{#if leftTab === 'chat'}
				<div 
					bind:this={chatContainer}
					class="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 select-text">
					{#each messages as msg (msg.id)}
						<div class="flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
							<div class="flex items-start gap-2.5 max-w-[90%] {msg.role === 'user' ? 'flex-row-reverse' : ''}">
								<!-- Avatar -->
								<div class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 {
									msg.role === 'user' 
										? 'bg-violet-600 text-white' 
										: 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-violet-500/20'
								}">
									{#if msg.role === 'user'}
										<User class="w-3.5 h-3.5" />
									{:else}
										<Bot class="w-3.5 h-3.5" />
									{/if}
								</div>

								<!-- Bubble -->
								<div class="p-3.5 rounded-2xl text-xs leading-relaxed {
									msg.role === 'user'
										? 'bg-violet-600 text-white rounded-tr-none shadow-md'
										: 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
								}">
									<p class="whitespace-pre-wrap">{msg.content}</p>
									<span class="block text-[10px] mt-1.5 opacity-60 text-right">{msg.timestamp}</span>
								</div>
							</div>

							<!-- Suggested Replies Chips -->
							{#if msg.suggestedReplies && msg.suggestedReplies.length > 0 && msg === messages[messages.length - 1]}
								<div class="mt-2.5 flex flex-wrap gap-1.5 pl-9">
									{#each msg.suggestedReplies as reply}
										<button 
											onclick={() => handleSendChatMessage(reply)}
											class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-violet-300 hover:text-white border border-slate-800 hover:border-violet-500/40 text-[11px] transition text-left">
											💬 {reply}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/each}

					<!-- Loading pulse bubble -->
					{#if isSending}
						<div class="flex items-start gap-2.5">
							<div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
								<Bot class="w-3.5 h-3.5 animate-pulse" />
							</div>
							<div class="p-3 rounded-2xl bg-slate-900 text-slate-400 border border-slate-800 rounded-tl-none text-xs flex items-center gap-2">
								<RefreshCw class="w-3.5 h-3.5 animate-spin text-violet-400" />
								<span>AI sedang memproses instruksi & merakit UI...</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Floating Confirmation & Quick Action bar (when HTML exists) -->
				{#if !generatedHtml}
					<div class="px-4 py-2 border-t border-slate-800/80 bg-slate-950/90">
						<button 
							onclick={handleConfirmAndGenerate}
							disabled={isSending}
							class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50">
							<Sparkles class="w-4 h-4" />
							<span>✅ Susun PRD & Generate {pageType === 'dashboard' ? 'Dashboard' : 'Landing Page'} Sekarang</span>
						</button>
					</div>
				{:else}
					<!-- Quick Revision Chips -->
					<div class="px-4 py-2 border-t border-slate-800/60 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
						<span class="text-slate-500 text-[10px] shrink-0 font-medium">Revisi Cepat:</span>
						<button 
							onclick={() => handleSendChatMessage('Tolong ubah warna aksen halaman ini menjadi hijau emerald dan perhalus kontras dark-nya')}
							class="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1 transition">
							<Paintbrush class="w-3 h-3 text-emerald-400" /> Ganti Aksen Warna
						</button>
						<button 
							onclick={() => handleSendChatMessage('Tolong tambahkan komponen visual chart grafik baru yang relevan dengan analitik di atas')}
							class="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1 transition">
							<BarChart3 class="w-3 h-3 text-sky-400" /> Tambah Chart
						</button>
						<button 
							onclick={() => handleSendChatMessage('Tolong tambahkan section FAQ accordion interaktif menggunakan Alpine.js di bagian bawah')}
							class="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 flex items-center gap-1 transition">
							<HelpCircle class="w-3 h-3 text-amber-400" /> Tambah FAQ
						</button>
					</div>
				{/if}

				<!-- Chat Input Form -->
				<div class="p-3 border-t border-slate-800/80 bg-slate-950/90 shrink-0">
					<form 
						onsubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
						class="relative flex items-center">
						<input 
							type="text"
							bind:value={inputMessage}
							placeholder={generatedHtml ? "Minta revisi elemen (contoh: 'Ubah hero jadi split 50/50', 'Ganti warna aksen jadi Rose')..." : "Ketik ide aplikasi atau diskusikan fitur yang ingin dibuat..."}
							disabled={isSending}
							class="w-full py-2.5 pl-3.5 pr-12 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/60 transition"
						/>
						<button 
							type="submit"
							disabled={isSending || !inputMessage.trim()}
							class="absolute right-1.5 p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
							<Send class="w-3.5 h-3.5" />
						</button>
					</form>
				</div>
			{:else}
				<!-- Tab 2: Full PRD Document Editor -->
				<div class="flex-1 p-4 flex flex-col min-h-0 overflow-hidden space-y-2">
					<div class="flex items-center justify-between text-xs">
						<label class="font-bold text-slate-200 flex items-center gap-1.5">
							<FileText class="w-3.5 h-3.5 text-indigo-400" /> Dokumen PRD / Spesifikasi Sistem:
						</label>
						<span class="text-[10px] text-slate-500 font-mono">{prdInput.length} karakter</span>
					</div>

					<textarea 
						bind:value={prdInput}
						placeholder="Dokumen PRD akan terisi otomatis saat berdiskusi di tab chat, atau Anda bisa mengetik/menempel PRD Anda di sini..."
						spellcheck="false"
						class="flex-1 w-full p-4 bg-slate-900/70 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none border border-slate-800 rounded-xl focus:border-violet-500/50 transition selection:bg-violet-500/30"
					></textarea>

					<button 
						onclick={handleConfirmAndGenerate}
						disabled={isSending || !prdInput.trim()}
						class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition disabled:opacity-50">
						<Sparkles class="w-4 h-4" />
						<span>Generate {pageType === 'dashboard' ? 'Dashboard' : 'Landing Page'} dari Dokumen Ini</span>
					</button>
				</div>
			{/if}
		</section>

		<!-- RIGHT PANEL: Live View & Code Studio (50% width) -->
		<section class="h-full flex flex-col overflow-hidden bg-[#04060e] relative min-h-0 min-w-0">
			<!-- Right Panel Toolbar -->
			<div class="p-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs shrink-0">
				<!-- Left: View Mode Tabs -->
				<div class="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
					<button 
						onclick={() => activeTab = 'preview'}
						class="px-3 py-1 rounded transition {activeTab === 'preview' ? 'bg-slate-800 text-violet-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
						<Eye class="w-3.5 h-3.5 inline mr-1" /> Pratinjau Interaktif
					</button>
					<button 
						onclick={() => activeTab = 'code'}
						class="px-3 py-1 rounded transition {activeTab === 'code' ? 'bg-slate-800 text-violet-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
						<Code2 class="w-3.5 h-3.5 inline mr-1" /> Kode HTML
					</button>
				</div>

				<!-- Center: Responsive Viewport Switcher (Only visible in Preview tab) -->
				{#if activeTab === 'preview'}
					<div class="hidden sm:flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
						<button 
							onclick={() => viewportMode = 'desktop'}
							title="Ukuran Desktop (100%)"
							class="px-2.5 py-1 rounded transition flex items-center gap-1 {viewportMode === 'desktop' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}">
							<Monitor class="w-3.5 h-3.5" />
							<span class="text-[11px]">Desktop</span>
						</button>
						<button 
							onclick={() => viewportMode = 'tablet'}
							title="Ukuran Tablet (768px)"
							class="px-2.5 py-1 rounded transition flex items-center gap-1 {viewportMode === 'tablet' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}">
							<Tablet class="w-3.5 h-3.5" />
							<span class="text-[11px]">Tablet</span>
						</button>
						<button 
							onclick={() => viewportMode = 'mobile'}
							title="Ukuran Ponsel (390px)"
							class="px-2.5 py-1 rounded transition flex items-center gap-1 {viewportMode === 'mobile' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}">
							<Smartphone class="w-3.5 h-3.5" />
							<span class="text-[11px]">Mobile</span>
						</button>
					</div>
				{/if}

				<!-- Right: Status indicator -->
				<div class="flex items-center space-x-2">
					{#if generatedHtml}
						<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ready
						</span>
					{/if}
				</div>
			</div>

			<!-- Main View Area with Instant Iframe Rendering -->
			{#if activeTab === 'preview'}
				<div class="flex-1 bg-[#04060d] p-3 sm:p-5 overflow-auto flex justify-center items-start relative">
					<!-- Loading Overlay when generating or revising -->
					{#if isSending}
						<div class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
							<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-violet-500/30 mb-4 animate-bounce">
								<Sparkles class="w-8 h-8 animate-spin" />
							</div>
							<h3 class="text-base font-bold text-white mb-1.5">
								{generatedHtml ? 'Memproses Revisi & Memperbarui Elemen UI...' : `Menyusun ${pageType === 'dashboard' ? 'Dashboard Aplikasi' : 'Landing Page'} Anti-Slop...`}
							</h3>
							<p class="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
								AI sedang menganalisis instruksi, menyelaraskan desain dengan skill.md, dan merakit ulang kode HTML...
							</p>
							<div class="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
								<div class="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse w-3/4"></div>
							</div>
						</div>
					{/if}

					{#if generatedHtml}
						<!-- Rendered Live Iframe using srcdoc (Instant Reactive Rendering) -->
						<div 
							class="h-full transition-all duration-300 bg-slate-950 overflow-hidden {
								viewportMode === 'desktop' ? 'w-full shadow-none' : 
								viewportMode === 'tablet' ? 'w-[768px] rounded-2xl border border-slate-800 shadow-2xl shadow-black/80' : 
								'w-[390px] rounded-3xl border-2 border-slate-800 shadow-2xl shadow-black/80'
							}">
							<iframe 
								srcdoc={generatedHtml}
								title="Live Preview Anti-Slop Page"
								class="w-full h-full border-0 bg-transparent"
								sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
							></iframe>
						</div>
					{:else if !isSending}
						<!-- Empty Starter State -->
						<div class="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
							<div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
								<LayoutTemplate class="w-8 h-8" />
							</div>
							<h4 class="text-sm font-bold text-slate-300 mb-1">Pratinjau Halaman Belum Tersedia</h4>
							<p class="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
								Ketik ide aplikasi di tab chat sebelah kiri, atau pilih preset untuk berdiskusi dengan AI dan langsung generate pratinjau.
							</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Direct HTML Code Editor -->
				<div class="flex-1 flex flex-col p-4 bg-[#050811] overflow-hidden">
					<div class="flex items-center justify-between mb-2">
						<span class="text-[11px] text-slate-400 font-mono">Kode Standalone HTML (Tailwind CDN + Phosphor Icons + Alpine.js):</span>
						<button 
							onclick={() => {
								saveState();
								activeTab = 'preview';
							}}
							class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
							<Check class="w-3.5 h-3.5" /> Simpan & Terapkan
						</button>
					</div>
					<textarea 
						bind:value={generatedHtml}
						placeholder="Kode HTML akan muncul di sini setelah proses generate..."
						spellcheck="false"
						class="flex-1 w-full p-4 bg-slate-950/90 text-violet-200 font-mono text-xs leading-relaxed focus:outline-none resize-none border border-slate-800 rounded-xl focus:border-violet-500/50 transition selection:bg-violet-500/30"
					></textarea>
				</div>
			{/if}
		</section>
	</div>
</div>
