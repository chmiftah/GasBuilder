<script lang="ts">
	import { 
		Monitor, 
		Smartphone, 
		RefreshCw, 
		ExternalLink, 
		Code2, 
		Sparkles, 
		Rocket, 
		Layers,
		CheckCircle2,
		AlertCircle
	} from '@lucide/svelte';
	import type { GASFile, PRDSpec } from '$lib/types';
	import { onMount } from 'svelte';

	let {
		files = [],
		prd = null,
		onSwitchToCode = () => {},
		onSwitchToChat = () => {},
		onDeploy = () => {}
	} = $props<{
		files: GASFile[];
		prd?: PRDSpec | null;
		onSwitchToCode?: () => void;
		onSwitchToChat?: () => void;
		onDeploy?: () => void;
	}>();

	let deviceMode = $state<'desktop' | 'mobile'>('desktop');
	let iframeEl: HTMLIFrameElement | null = $state(null);
	let isRefreshing = $state(false);

	const htmlFile = $derived(files.find((f: GASFile) => f.type === 'HTML') || null);

	function getPreparedHtml(): string {
		if (!htmlFile) return '';
		let src = htmlFile.source
			.replace(/<\?=\s*appName\s*\?>/g, prd?.appName || 'GAS Web App')
			.replace(/<\?=\s*.*?\s*\?>/g, '');

		// Inject mock helper script if google.script.run is called without safety check
		const mockScript = '<' + 'script>' + `
  if (typeof google === 'undefined') {
    window.google = {
      script: {
        run: new Proxy({}, {
          get: function(target, prop) {
            if (prop === 'withSuccessHandler') {
              return function(onSuccess) {
                return new Proxy({}, {
                  get: function(t, method) {
                    return function(...args) {
                      console.log('[Mock GAS API] Called:', method, args);
                      setTimeout(() => {
                        if (onSuccess) onSuccess({ success: true, message: 'Operasi berhasil disimulasikan!' });
                      }, 200);
                    };
                  }
                });
              };
            }
            if (prop === 'withFailureHandler') {
              return function() { return window.google.script.run; };
            }
            return function(...args) {
              console.log('[Mock GAS API] Called:', prop, args);
            };
          }
        })
      }
    };
  }
` + '<' + '/script>';
		if (src.includes('<head>')) {
			return src.replace('<head>', '<head>' + mockScript);
		}
		return mockScript + src;
	}

	function refreshPreview() {
		if (!iframeEl || !htmlFile) return;
		isRefreshing = true;
		const cleanHtml = getPreparedHtml();
		const blob = new Blob([cleanHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		iframeEl.src = url;
		setTimeout(() => {
			isRefreshing = false;
		}, 400);
	}

	function openInNewTab() {
		if (!htmlFile) return;
		const cleanHtml = getPreparedHtml();
		const blob = new Blob([cleanHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
	}

	$effect(() => {
		if (htmlFile && iframeEl) {
			refreshPreview();
		}
	});

	onMount(() => {
		setTimeout(refreshPreview, 100);
	});
</script>

<div class="flex flex-col h-full bg-[#060913] text-slate-100 select-none">
	<!-- Control Toolbar -->
	<div class="h-12 border-b border-slate-800/90 bg-slate-950/80 px-4 flex items-center justify-between shrink-0">
		<div class="flex items-center space-x-3">
			<div class="flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
				<span class="text-xs font-bold text-white tracking-wide">
					{prd?.appName || 'Aplikasi Web GAS'}
				</span>
				<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
					Live Interactive Preview
				</span>
			</div>
		</div>

		<!-- Center: Device Mode Toggles -->
		<div class="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
			<button 
				onclick={() => deviceMode = 'desktop'}
				class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition {deviceMode === 'desktop' ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
				<Monitor class="w-3.5 h-3.5" />
				<span>Desktop</span>
			</button>
			<button 
				onclick={() => deviceMode = 'mobile'}
				class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition {deviceMode === 'mobile' ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
				<Smartphone class="w-3.5 h-3.5" />
				<span>Mobile</span>
			</button>
		</div>

		<!-- Right: Quick actions -->
		<div class="flex items-center space-x-2">
			<button 
				onclick={refreshPreview}
				title="Muat ulang aplikasi"
				class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
				<RefreshCw class="w-4 h-4 {isRefreshing ? 'animate-spin text-emerald-400' : ''}" />
			</button>

			<button 
				onclick={openInNewTab}
				title="Buka aplikasi di tab baru browser"
				class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition">
				<ExternalLink class="w-3.5 h-3.5 text-cyan-400" />
				<span class="hidden sm:inline">Tab Baru</span>
			</button>

			<button 
				onclick={onSwitchToCode}
				title="Lihat atau edit kode sumber"
				class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition">
				<Code2 class="w-3.5 h-3.5 text-amber-400" />
				<span class="hidden sm:inline">Edit Kode</span>
			</button>

			<button 
				onclick={onDeploy}
				class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20">
				<Rocket class="w-3.5 h-3.5" />
				<span>Deploy</span>
			</button>
		</div>
	</div>

	<!-- Main Canvas / Iframe Container -->
	<div class="flex-1 bg-[#040711] p-3 sm:p-5 flex items-center justify-center overflow-auto">
		{#if htmlFile}
			<div class="transition-all duration-300 h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white {deviceMode === 'desktop' ? 'w-full' : 'w-[410px] h-[820px] max-h-full ring-8 ring-slate-800/90 rounded-[36px]'}">
				<iframe 
					bind:this={iframeEl}
					title="GAS Web App Live View"
					class="w-full h-full border-0 bg-white"
					sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
				></iframe>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
					<Layers class="w-8 h-8" />
				</div>
				<div class="max-w-md space-y-2">
					<h3 class="text-sm font-bold text-white">Tampilan Aplikasi Belum Siap</h3>
					<p class="text-xs text-slate-400 leading-relaxed">
						File <code class="text-emerald-400 font-mono">index.html</code> belum digenerate untuk project ini. Selesaikan diskusi dengan AI dan buat kode terlebih dahulu.
					</p>
					<div class="pt-2 flex justify-center gap-2">
						<button 
							onclick={onSwitchToChat}
							class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition">
							<Sparkles class="w-3.5 h-3.5" />
							<span>Buka AI Studio</span>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
