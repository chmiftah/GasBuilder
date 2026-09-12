<script lang="ts">
	import { 
		Sparkles, 
		CheckCircle2, 
		AlertTriangle, 
		XCircle, 
		Cpu, 
		FileCode2, 
		Database, 
		Layers,
		Check,
		ArrowRight
	} from '@lucide/svelte';

	export interface GenStep {
		title: string;
		desc: string;
		status: 'waiting' | 'running' | 'done' | 'warning' | 'error';
	}

	let {
		isOpen = false,
		steps = [],
		activeStep = 0,
		generatorMode = '',
		notice = '',
		error = '',
		onClose = () => {}
	} = $props<{
		isOpen: boolean;
		steps: GenStep[];
		activeStep: number;
		generatorMode?: string;
		notice?: string;
		error?: string;
		onClose: () => void;
	}>();

	const isCompleted = $derived(steps.length > 0 && steps.every((s: GenStep) => s.status === 'done' || s.status === 'warning'));
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
		<div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-700/80 bg-[#0b101e] shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
			<!-- Background Glow Accent -->
			<div class="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
						<Sparkles class="w-5 h-5 {isCompleted ? '' : 'animate-spin'}" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white flex items-center gap-2">
							<span>{isCompleted ? 'Perakitan Kode Selesai!' : 'Merakit Kode Google Apps Script...'}</span>
						</h3>
						<p class="text-[11px] text-slate-400">
							{isCompleted ? 'Seluruh 4 file GAS siap ditinjau di Code Studio' : 'Memproses 5 fase implementasi berdasarkan PRD terbaru'}
						</p>
					</div>
				</div>
			</div>

			<!-- Notice / Alert Banner (misal DeepSeek Limit / Local Fallback) -->
			{#if notice}
				<div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
					<AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
					<div class="space-y-0.5">
						<p class="font-bold text-[11px]">Informasi Engine Generator:</p>
						<p class="text-[11px] text-amber-200/90 leading-relaxed">{notice}</p>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
					<XCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
					<div class="space-y-0.5">
						<p class="font-bold text-[11px]">Terjadi Kendala:</p>
						<p class="text-[11px] text-rose-200/90 leading-relaxed">{error}</p>
					</div>
				</div>
			{/if}

			<!-- Steps List -->
			<div class="space-y-3">
				{#each steps as step, idx}
					<div class="flex items-start space-x-3 p-3 rounded-2xl transition {idx === activeStep ? 'bg-slate-900/80 border border-slate-700/80 shadow-inner' : 'bg-slate-950/40 border border-transparent'}">
						<!-- Icon / Status Indicator -->
						<div class="mt-0.5 shrink-0">
							{#if step.status === 'done'}
								<div class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
									<Check class="w-3.5 h-3.5" />
								</div>
							{:else if step.status === 'running'}
								<div class="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
									<div class="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
								</div>
							{:else if step.status === 'warning'}
								<div class="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
									<AlertTriangle class="w-3.5 h-3.5" />
								</div>
							{:else if step.status === 'error'}
								<div class="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
									<XCircle class="w-3.5 h-3.5" />
								</div>
							{:else}
								<div class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-bold">
									{idx + 1}
								</div>
							{/if}
						</div>

						<!-- Step Text Content -->
						<div class="flex-1 min-w-0">
							<p class="text-xs font-bold {idx === activeStep ? 'text-white' : step.status === 'done' ? 'text-slate-200' : 'text-slate-400'}">{step.title}</p>
							<p class="text-[11px] {idx === activeStep ? 'text-blue-300' : 'text-slate-500'} mt-0.5">{step.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer Action -->
			<div class="pt-2 flex items-center justify-end space-x-2">
				{#if isCompleted || error}
					<button 
						onclick={onClose}
						class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center justify-center gap-2">
						<span>Buka Code Studio & Live Preview</span>
						<ArrowRight class="w-4 h-4" />
					</button>
				{:else}
					<div class="w-full py-2.5 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
						<div class="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
						<span>Sedang memvalidasi dan menyusun file...</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
