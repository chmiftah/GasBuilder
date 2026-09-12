<script lang="ts">
	import { X, Eye, RefreshCw, ExternalLink, Smartphone, Monitor } from '@lucide/svelte';
	import type { GASFile } from '$lib/types';

	let {
		isOpen = false,
		files = [],
		onClose = () => {}
	} = $props<{
		isOpen: boolean;
		files: GASFile[];
		onClose: () => void;
	}>();

	let deviceMode = $state<'desktop' | 'mobile'>('desktop');
	let iframeEl: HTMLIFrameElement | null = $state(null);

	const htmlFile = $derived(files.find((f: GASFile) => f.type === 'HTML') || null);

	function refreshPreview() {
		if (iframeEl && htmlFile) {
			let cleanHtml = htmlFile.source
				.replace(/<\?=\s*appName\s*\?>/g, 'GAS Web App')
				.replace(/<\?=\s*.*?\s*\?>/g, '');
			const blob = new Blob([cleanHtml], { type: 'text/html' });
			iframeEl.src = URL.createObjectURL(blob);
		}
	}

	$effect(() => {
		if (isOpen && htmlFile) {
			setTimeout(refreshPreview, 50);
		}
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
		<div class="glass-panel w-full max-w-6xl h-[90vh] rounded-2xl border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
						<Eye class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-xs font-bold text-white flex items-center gap-2">
							<span>Interactive Sandbox Preview</span>
							<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Mock GAS RPC Active</span>
						</h3>
						<p class="text-[11px] text-slate-400">Uji langsung antarmuka Web App GAS sebelum di-deploy</p>
					</div>
				</div>

				<!-- Center: Device mode toggles -->
				<div class="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
					<button 
						onclick={() => deviceMode = 'desktop'}
						class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition {deviceMode === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}">
						<Monitor class="w-3.5 h-3.5" />
						<span class="hidden sm:inline">Desktop</span>
					</button>
					<button 
						onclick={() => deviceMode = 'mobile'}
						class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition {deviceMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}">
						<Smartphone class="w-3.5 h-3.5" />
						<span class="hidden sm:inline">Mobile</span>
					</button>
				</div>

				<!-- Right: Actions -->
				<div class="flex items-center space-x-2">
					<button 
						onclick={refreshPreview}
						title="Muat Ulang Sandbox"
						class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
						<RefreshCw class="w-4 h-4" />
					</button>
					<button 
						onclick={onClose}
						class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Preview Body -->
			<div class="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
				{#if htmlFile}
					<div class="transition-all duration-300 h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0b0f19] {deviceMode === 'desktop' ? 'w-full' : 'w-[390px] h-[780px] max-h-full ring-8 ring-slate-800 rounded-3xl'}">
						<iframe 
							bind:this={iframeEl}
							title="GAS Web App Sandbox Preview"
							class="w-full h-full border-0 bg-transparent"
							sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
						></iframe>
					</div>
				{:else}
					<p class="text-xs text-slate-400">File index.html belum tersedia untuk preview.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
