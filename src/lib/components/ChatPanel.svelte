<script lang="ts">
	import { Send, Sparkles, Bot, User, CornerDownLeft, FileText, ArrowRight, Lightbulb } from '@lucide/svelte';
	import type { ChatMessage, PRDSpec } from '$lib/types';
	import { tick } from 'svelte';

	let {
		messages = [],
		isSending = false,
		prd = null,
		onSendMessage = (text: string) => {},
		onViewPrd = () => {}
	} = $props<{
		messages: ChatMessage[];
		isSending: boolean;
		prd: PRDSpec | null;
		onSendMessage: (text: string) => void;
		onViewPrd: () => void;
	}>();

	let inputMessage = $state('');
	let chatContainer: HTMLElement | null = $state(null);

	// Show "Confirm PRD" button after discussion has started but PRD not yet created
	const canConfirmPrd = $derived(
		!prd &&
		messages.length >= 3 &&
		messages.some((m: ChatMessage) => m.role === 'assistant')
	);

	function handleConfirmPrd() {
		onSendMessage('[KONFIRMASI_SUSUN_PRD] Oke, saya sudah setuju dengan diskusi tadi. Tolong susun PRD lengkapnya sekarang.');
	}

	const templateIdeas = [
		'Sistem Pengajuan & Approval Cuti Karyawan',
		'Aplikasi Helpdesk Tiket Support & Tracking',
		'Manajemen Inventaris Barang & Scanner Barcode',
		'Portal Pendaftaran Acara / Webinar dengan Auto-Email'
	];

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	$effect(() => {
		if (messages.length > 0 || isSending) {
			scrollToBottom();
		}
	});

	function handleFormSubmit(e: Event) {
		e.preventDefault();
		if (!inputMessage.trim() || isSending) return;
		onSendMessage(inputMessage.trim());
		inputMessage = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleFormSubmit(e);
		}
	}

	function formatMarkdown(text: string): string {
		if (!text) return '';
		// Strip JSON PRD block from visible text in chat bubble
		const clean = text.replace(/```(?:json:prd|json)?[\s\S]*?```/g, '').trim();
		if (!clean) return 'Dokumen PRD spesifikasi aplikasi telah berhasil diperbarui!';

		return clean
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[11px]">$1</code>')
			.replace(/\n\n/g, '<br/><br/>')
			.replace(/\n/g, '<br/>');
	}
</script>

<div class="flex flex-col h-full bg-slate-900/40 border-r border-slate-800/80">
	<!-- Panel Header -->
	<div class="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
		<div class="flex items-center space-x-2.5">
			<div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
				<Sparkles class="w-4 h-4" />
			</div>
			<div>
				<h2 class="text-xs font-bold text-white tracking-wide">AI Discovery Interview</h2>
				<p class="text-[11px] text-slate-400">Diskusi ide aplikasi untuk menyusun PRD</p>
			</div>
		</div>
		{#if prd}
			<button 
				onclick={onViewPrd}
				class="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition">
				<FileText class="w-3 h-3" />
				<span>Buka PRD</span>
			</button>
		{/if}
	</div>

	<!-- Chat Messages Area -->
	<div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
		{#if messages.length === 0}
			<!-- Empty State / Starter Ideas -->
			<div class="h-full flex flex-col justify-center items-center text-center p-6 space-y-5">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
					<Bot class="w-7 h-7" />
				</div>
				<div class="max-w-md space-y-1.5">
					<h3 class="text-sm font-bold text-white">Halo! Mau buat Web App GAS apa hari ini?</h3>
					<p class="text-xs text-slate-400 leading-relaxed">
						Ceritakan ide Anda secara bebas. AI System Analyst akan membantu menanyakan detail dan merancang arsitektur aplikasi siap pakai!
					</p>
				</div>

				<!-- Quick Templates -->
				<div class="w-full max-w-md space-y-2 pt-2 text-left">
					<p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
						<Lightbulb class="w-3 h-3 text-amber-400" /> Contoh Ide Cepat:
					</p>
					<div class="grid grid-cols-1 gap-2">
						{#each templateIdeas as idea}
							<button 
								onclick={() => onSendMessage(`Saya ingin membuat aplikasi ${idea}`)}
								class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left text-xs text-slate-300 hover:text-white transition flex items-center justify-between group">
								<span>{idea}</span>
								<ArrowRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
							</button>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			{#each messages as msg}
				<div class="flex items-start space-x-3 {msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}">
					<!-- Avatar -->
					<div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 {msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-800 border border-slate-700 text-emerald-400'}">
						{#if msg.role === 'user'}
							<User class="w-4 h-4" />
						{:else}
							<Bot class="w-4 h-4" />
						{/if}
					</div>

					<!-- Bubble Content -->
					<div class="max-w-[88%] sm:max-w-[85%] space-y-2">
						<div class="p-3.5 rounded-2xl text-xs leading-relaxed {msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10 font-normal' : 'bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-tl-none glass-card'}">
							{@html formatMarkdown(msg.content)}
						</div>

						<!-- Suggested reply chips if any -->
						{#if msg.suggestedReplies && msg.suggestedReplies.length > 0 && msg.role === 'assistant'}
							<div class="flex flex-wrap gap-1.5 pt-1">
								{#each msg.suggestedReplies as reply}
									<button 
										onclick={() => onSendMessage(reply)}
										class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition shadow-xs">
										{reply}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}

			{#if isSending}
				<div class="flex items-start space-x-3">
					<div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0">
						<Bot class="w-4 h-4" />
					</div>
					<div class="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/80 border border-slate-700/70 flex items-center space-x-2 text-xs text-slate-400">
						<div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
						<div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
						<div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150"></div>
						<span class="text-[11px] text-slate-400 ml-1">AI sedang memproses...</span>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- PRD Ready Banner if available -->
	{#if prd}
		<div class="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
					<FileText class="w-4 h-4" />
				</div>
				<div>
					<p class="text-xs font-bold text-white">PRD Siap Direview!</p>
					<p class="text-[10px] text-slate-300">{prd.appName}</p>
				</div>
			</div>
			<button 
				onclick={onViewPrd}
				class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center gap-1">
				<span>Review & Generate</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</button>
		</div>
	{/if}

	<!-- Input Area -->
	<div class="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
		<!-- Confirm PRD Button — appears after discussion has started -->
		{#if canConfirmPrd}
			<div class="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-teal-950/50 border border-emerald-500/40 animate-pulse-once">
				<div class="flex-1 min-w-0">
					<p class="text-[11px] font-semibold text-emerald-300">Sudah cukup diskusi?</p>
					<p class="text-[10px] text-slate-400 truncate">Klik tombol ini untuk minta AI menyusun PRD berdasarkan diskusi</p>
				</div>
				<button
					onclick={handleConfirmPrd}
					disabled={isSending}
					class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95">
					<FileText class="w-3.5 h-3.5" />
					<span>✅ Setuju, Susun PRD</span>
				</button>
			</div>
		{/if}

		<form onsubmit={handleFormSubmit} class="relative">
			<textarea 
				bind:value={inputMessage}
				onkeydown={handleKeyDown}
				rows="2"
				placeholder="{canConfirmPrd ? 'Jawab pertanyaan AI atau klik ✅ Setuju, Susun PRD di atas...' : 'Ketik ide aplikasimu di sini... (Enter untuk kirim)'}"
				class="w-full pl-3.5 pr-12 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none transition shadow-inner"
			></textarea>
			<button 
				type="submit"
				disabled={!inputMessage.trim() || isSending}
				class="absolute right-2.5 bottom-3 p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 disabled:opacity-40 disabled:hover:bg-emerald-500 transition transform active:scale-95 shadow-md shadow-emerald-500/20">
				<Send class="w-3.5 h-3.5" />
			</button>
		</form>
	</div>
</div>
