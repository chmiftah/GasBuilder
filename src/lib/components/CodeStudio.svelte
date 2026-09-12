<script lang="ts">
	import { 
		Code2, 
		Copy, 
		Check, 
		Download, 
		Eye, 
		Rocket, 
		FileCode, 
		FileJson, 
		FileText,
		Edit3,
		Sparkles,
		Send,
		RefreshCw,
		AlertCircle,
		CheckCircle2,
		ChevronDown,
		ChevronUp,
		Layers
	} from '@lucide/svelte';
	import type { GASFile, PRDSpec } from '$lib/types';

	let {
		files = [],
		prd = null,
		activeFileIndex = 0,
		onSelectFile = (idx: number) => {},
		onCodeChange = (idx: number, newCode: string) => {},
		onFilesUpdated = (newFiles: GASFile[], notice?: string) => {},
		onOpenPreview = () => {},
		onDeploy = () => {}
	} = $props<{
		files: GASFile[];
		prd?: PRDSpec | null;
		activeFileIndex?: number;
		onSelectFile?: (idx: number) => void;
		onCodeChange?: (idx: number, newCode: string) => void;
		onFilesUpdated?: (newFiles: GASFile[], notice?: string) => void;
		onOpenPreview?: () => void;
		onDeploy?: () => void;
	}>();

	let copied = $state(false);
	let isEditMode = $state(false);

	// Improve State
	let isImproveOpen = $state(true);
	let improveInstruction = $state('');
	let targetScope = $state<'all' | 'active'>('all');
	let isImproving = $state(false);
	let improveError = $state<string | null>(null);
	let improveSuccess = $state<string | null>(null);

	const activeFile = $derived(files[activeFileIndex] || files[0] || null);

	const quickImprovements = [
		{ label: '📊 Export CSV', text: 'Tambahkan tombol Export data ke CSV di tabel transaksi/data dan fungsi download-nya.' },
		{ label: '📱 Responsif Mobile', text: 'Tingkatkan responsivitas tampilan mobile, perbaiki sidebar drawer, dan optimalkan layout kartu.' },
		{ label: '🎨 UI & Animasi Modern', text: 'Percantik tampilan UI dengan badge status berwarna, font Inter rapi, dan transisi hover yang halus.' },
		{ label: '🛡️ Validasi & Toast', text: 'Tambahkan validasi input form (wajib diisi, format nominal angka) dan popup notifikasi toast elegan.' },
		{ label: '📈 Filter & Pencarian', text: 'Sempurnakan fitur pencarian real-time dan tambahkan dropdown filter kategori/status.' }
	];

	function copyActiveCode() {
		if (!activeFile) return;
		navigator.clipboard.writeText(activeFile.source);
		copied = true;
		setTimeout(() => copied = false, 2500);
	}

	function handleSourceInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		if (activeFile) {
			onCodeChange(activeFileIndex, target.value);
		}
	}

	function downloadCurrentFile() {
		if (!activeFile) return;
		const ext = activeFile.type === 'SERVER_JS' ? '.gs' : activeFile.type === 'HTML' ? '.html' : '.json';
		const blob = new Blob([activeFile.source], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activeFile.name}${ext}`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function getFileIcon(type: string) {
		if (type === 'SERVER_JS') return FileCode;
		if (type === 'HTML') return FileText;
		return FileJson;
	}

	function getFileExtension(type: string) {
		if (type === 'SERVER_JS') return '.gs';
		if (type === 'HTML') return '.html';
		return '.json';
	}

	function applyQuickChip(text: string) {
		improveInstruction = text;
	}

	async function handleImproveSubmit() {
		if (!improveInstruction.trim() || isImproving || files.length === 0) return;

		isImproving = true;
		improveError = null;
		improveSuccess = null;

		try {
			const targetFileName = targetScope === 'active' && activeFile ? activeFile.name : 'all';
			const res = await fetch('/api/improve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prd,
					files,
					instruction: improveInstruction.trim(),
					targetFileName
				})
			});

			const data = await res.json();
			if (!res.ok || data.error) {
				throw new Error(data.error || 'Gagal memproses perbaikan kode');
			}

			if (data.files && data.files.length > 0) {
				onFilesUpdated(data.files, data.explanation || 'Kode berhasil diperbarui!');
				const modifiedList = data.modifiedFileNames?.join(', ') || 'file';
				improveSuccess = `Berhasil memperbarui ${modifiedList}! ${data.explanation || ''}`;
				improveInstruction = '';

				// Switch tab to first modified file if found
				if (data.modifiedFileNames && data.modifiedFileNames.length > 0) {
					const firstModIdx = data.files.findIndex((f: GASFile) => f.name.toLowerCase() === data.modifiedFileNames[0].toLowerCase());
					if (firstModIdx >= 0) {
						onSelectFile(firstModIdx);
					}
				}

				setTimeout(() => {
					improveSuccess = null;
				}, 6000);
			}
		} catch (err: any) {
			improveError = err.message || 'Terjadi kesalahan saat memanggil AI';
		} finally {
			isImproving = false;
		}
	}
</script>

<div class="flex flex-col h-full bg-[#080d1a]">
	{#if files.length === 0}
		<!-- Empty State -->
		<div class="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
			<div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
				<Code2 class="w-8 h-8" />
			</div>
			<div class="max-w-md space-y-1.5">
				<h3 class="text-sm font-bold text-white">Kode Belum Digenerate</h3>
				<p class="text-xs text-slate-400 leading-relaxed">
					Selesaikan wawancara dan setujui PRD terlebih dahulu untuk merakit kode Google Apps Script lengkap.
				</p>
			</div>
		</div>
	{:else}
		<!-- File Tabs Bar -->
		<div class="border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between px-3 overflow-x-auto shrink-0">
			<div class="flex items-center space-x-1 py-2">
				{#each files as file, idx}
					{@const Icon = getFileIcon(file.type)}
					<button 
						onclick={() => onSelectFile(idx)}
						class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition {activeFileIndex === idx ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}">
						<Icon class="w-3.5 h-3.5 {activeFileIndex === idx ? 'text-emerald-400' : 'text-slate-500'}" />
						<span>{file.name}{getFileExtension(file.type)}</span>
					</button>
				{/each}
			</div>

			<!-- Quick Toolbar -->
			<div class="flex items-center space-x-2 py-2 shrink-0">
				<!-- Toggle Direct Edit Mode -->
				<button 
					onclick={() => isEditMode = !isEditMode}
					class="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition {isEditMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'}">
					<Edit3 class="w-3.5 h-3.5" />
					<span>{isEditMode ? 'Mode Edit Aktif' : 'Edit Langsung'}</span>
				</button>

				<button 
					onclick={copyActiveCode}
					class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition">
					{#if copied}
						<Check class="w-3.5 h-3.5 text-emerald-400" />
						<span class="text-emerald-400 font-semibold">Tersalin!</span>
					{:else}
						<Copy class="w-3.5 h-3.5" />
						<span>Salin</span>
					{/if}
				</button>
				
				<button 
					onclick={downloadCurrentFile}
					title="Unduh file aktif"
					class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
					<Download class="w-3.5 h-3.5" />
				</button>

				<button 
					onclick={onOpenPreview}
					class="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition">
					<Eye class="w-3.5 h-3.5" />
					<span>Live Preview</span>
				</button>

				<button 
					onclick={onDeploy}
					class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20">
					<Rocket class="w-3.5 h-3.5" />
					<span>Deploy / Sync</span>
				</button>
			</div>
		</div>

		<!-- File Meta Header -->
		{#if activeFile}
			<div class="px-5 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs shrink-0">
				<div class="flex items-center space-x-2">
					<span class="text-emerald-400 font-mono text-[11px] font-semibold">{activeFile.name}{getFileExtension(activeFile.type)}</span>
					{#if activeFile.description}
						<span class="text-slate-500">•</span>
						<span class="text-slate-400 text-[11px]">{activeFile.description}</span>
					{/if}
				</div>
				<div class="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
					{#if isEditMode}
						<span class="text-amber-400 font-sans flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Mode Pengeditan Langsung
						</span>
					{/if}
					<span>{activeFile.source.split('\n').length} baris</span>
				</div>
			</div>
		{/if}

		<!-- Code Editor View / Editable Textarea -->
		<div class="flex-1 overflow-auto bg-[#070b14] relative min-h-0">
			{#if activeFile}
				{#if isEditMode}
					<textarea 
						value={activeFile.source}
						oninput={handleSourceInput}
						spellcheck="false"
						class="w-full h-full p-4 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none border-0 selection:bg-emerald-500/30 selection:text-white"
					></textarea>
				{:else}
					<div class="p-4 text-xs font-mono leading-relaxed text-slate-200 select-text">
						<pre><code class="language-javascript">{activeFile.source}</code></pre>
					</div>
				{/if}
			{/if}
		</div>

		<!-- AI IMPROVE DOCKED PANEL -->
		<div class="border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md shrink-0 transition-all">
			<!-- Panel Header & Collapse Toggle -->
			<div class="px-4 py-2 flex items-center justify-between border-b border-slate-850 bg-slate-900/40">
				<div class="flex items-center gap-2">
					<div class="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950">
						<Sparkles class="w-3 h-3" />
					</div>
					<span class="text-xs font-semibold text-white tracking-wide">AI Code Improver</span>
					<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
						Modifikasi & Tambah Fitur Langsung
					</span>
				</div>

				<div class="flex items-center gap-3">
					<!-- Scope Switcher -->
					<div class="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-[11px]">
						<button 
							onclick={() => targetScope = 'all'}
							class="px-2 py-0.5 rounded transition {targetScope === 'all' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}">
							Semua File
						</button>
						<button 
							onclick={() => targetScope = 'active'}
							class="px-2 py-0.5 rounded transition {targetScope === 'active' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}">
							File Aktif ({activeFile?.name || 'Code'})
						</button>
					</div>

					<button 
						onclick={() => isImproveOpen = !isImproveOpen}
						class="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
						title={isImproveOpen ? "Sembunyikan panel" : "Buka panel improve"}>
						{#if isImproveOpen}
							<ChevronDown class="w-4 h-4" />
						{:else}
							<ChevronUp class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</div>

			{#if isImproveOpen}
				<div class="p-3.5 space-y-2.5">
					<!-- Quick Prompt Chips -->
					<div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
						<span class="text-slate-500 text-[10px] font-medium shrink-0">Ide Cepat:</span>
						{#each quickImprovements as chip}
							<button 
								onclick={() => applyQuickChip(chip.text)}
								class="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 shrink-0 transition flex items-center gap-1">
								<span>{chip.label}</span>
							</button>
						{/each}
					</div>

					<!-- Input & Action Bar -->
					<div class="flex items-start gap-2">
						<div class="flex-1 relative">
							<textarea 
								bind:value={improveInstruction}
								disabled={isImproving}
								placeholder="Contoh: 'Tambahkan tombol export CSV pada tabel dan fungsi download-nya', 'Ubah warna tema ke emerald glassmorphism'..."
								rows="2"
								onkeydown={(e) => {
									if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
										e.preventDefault();
										handleImproveSubmit();
									}
								}}
								class="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-xs rounded-xl p-2.5 border border-slate-800 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none transition"
							></textarea>
							<span class="absolute right-2.5 bottom-2 text-[10px] text-slate-500 select-none">
								Ctrl+Enter untuk kirim
							</span>
						</div>

						<button 
							onclick={handleImproveSubmit}
							disabled={isImproving || !improveInstruction.trim()}
							class="h-[52px] px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 shrink-0">
							{#if isImproving}
								<RefreshCw class="w-4 h-4 animate-spin" />
								<span>Memperbaiki...</span>
							{:else}
								<Sparkles class="w-4 h-4" />
								<span>Terapkan</span>
							{/if}
						</button>
					</div>

					<!-- Notifications / Feedback -->
					{#if improveSuccess}
						<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300 animate-in fade-in">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
							<div class="flex-1 leading-relaxed">
								{improveSuccess}
							</div>
						</div>
					{/if}

					{#if improveError}
						<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 animate-in fade-in">
							<AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
							<div class="flex-1 leading-relaxed">
								{improveError}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
