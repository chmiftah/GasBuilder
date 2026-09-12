<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllProjects, getActiveProjectId } from '$lib/stores/projectStore';
	import type { ProjectState, GASFile } from '$lib/types';
	import { Sparkles, ArrowLeft, RefreshCw, ExternalLink } from '@lucide/svelte';

	let project = $state<ProjectState | null>(null);
	let iframeEl: HTMLIFrameElement | null = $state(null);
	let isLoaded = $state(false);

	const htmlFile = $derived(project?.files.find((f: GASFile) => f.type === 'HTML') || null);

	function renderApp() {
		if (!iframeEl || !htmlFile) return;
		let src = htmlFile.source
			.replace(/<\?=\s*appName\s*\?>/g, project?.prd?.appName || 'GAS Web App')
			.replace(/<\?=\s*.*?\s*\?>/g, '');

		// Inject mock helper script
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
			src = src.replace('<head>', '<head>' + mockScript);
		} else {
			src = mockScript + src;
		}

		const blob = new Blob([src], { type: 'text/html' });
		iframeEl.src = URL.createObjectURL(blob);
	}

	onMount(() => {
		const projects = getAllProjects();
		const activeId = getActiveProjectId();
		if (activeId) {
			project = projects.find(p => p.id === activeId) || projects[0] || null;
		} else if (projects.length > 0) {
			project = projects[0];
		}
		isLoaded = true;
		setTimeout(renderApp, 100);
	});
</script>

<svelte:head>
	<title>{project?.prd?.appName || project?.title || 'Aplikasi GAS'}</title>
</svelte:head>

<div class="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col">
	{#if isLoaded}
		{#if htmlFile}
			<iframe 
				bind:this={iframeEl}
				title={project?.prd?.appName || 'GAS Web App'}
				class="w-full h-full border-0 bg-white"
				sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
			></iframe>

			<!-- Floating Studio Switcher Badge -->
			<div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-full py-1.5 px-3 shadow-2xl">
				<a 
					href="/"
					class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition">
					<Sparkles class="w-3.5 h-3.5" />
					<span>Buka GAS Builder Studio</span>
				</a>
				<span class="text-slate-700">|</span>
				<button 
					onclick={renderApp}
					title="Muat ulang"
					class="text-slate-400 hover:text-white p-0.5 transition">
					<RefreshCw class="w-3 h-3" />
				</button>
			</div>
		{:else}
			<div class="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
					<Sparkles class="w-8 h-8 text-emerald-400" />
				</div>
				<div class="max-w-md space-y-2">
					<h2 class="text-base font-bold text-white">Belum Ada Tampilan Aplikasi</h2>
					<p class="text-xs text-slate-400">
						Aplikasi belum digenerate kodenya. Buka Studio untuk merakit aplikasi menggunakan AI.
					</p>
					<div class="pt-2">
						<a 
							href="/"
							class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition">
							<ArrowLeft class="w-4 h-4" />
							<span>Kembali ke Studio</span>
						</a>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
