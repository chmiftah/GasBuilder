<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		FileSpreadsheet, 
		Workflow, 
		Sparkles, 
		ArrowRight, 
		Layers, 
		Cpu, 
		Rocket, 
		CheckCircle2, 
		ExternalLink, 
		Plus, 
		FolderKanban,
		Clock,
		ShieldCheck,
		LayoutTemplate,
		Palette
	} from '@lucide/svelte';
	import { getAllProjects } from '$lib/stores/projectStore';
	import type { ProjectState } from '$lib/types';

	let recentProjects = $state<ProjectState[]>([]);

	onMount(() => {
		recentProjects = getAllProjects().slice(0, 4);
	});
</script>

<svelte:head>
	<title>AI Workspace Suite • App Launcher Hub</title>
</svelte:head>

<div class="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
	<!-- Top Navigation Bar -->
	<header class="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-extrabold">
				<Sparkles class="w-5 h-5" />
			</div>
			<div>
				<h1 class="text-sm font-bold text-white tracking-tight flex items-center gap-2">
					<span>AI Developer Suite</span>
					<span class="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Portal Hub</span>
				</h1>
				<p class="text-[11px] text-slate-400">Pusat Aplikasi Pembangunan & Otomasi Cerdas</p>
			</div>
		</div>

		<div class="flex items-center space-x-3">
			<div class="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-medium">
				<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
				<span>Local Workspace Active</span>
			</div>
		</div>
	</header>

	<!-- Hero Banner -->
	<main class="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 space-y-10">
		<div class="space-y-3 text-center sm:text-left pt-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-semibold mb-1 shadow-inner">
				<Sparkles class="w-3.5 h-3.5" />
				<span>Pilih aplikasi untuk memulai pekerjaan Anda</span>
			</div>
			<h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
				App Launcher Hub
			</h2>
			<p class="text-sm text-slate-400 max-w-2xl leading-relaxed">
				Ekosistem alat pengembang berbasis AI untuk merancang arsitektur sistem, dokumen PRD, dan langsung merakit aplikasi siap pakai.
			</p>
		</div>

		<!-- Application Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<!-- APP 1: GAS Builder -->
			<div class="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
				<div class="space-y-4">
					<!-- Card Header -->
					<div class="flex items-start justify-between">
						<div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
							<FileSpreadsheet class="w-7 h-7 stroke-[2.2]" />
						</div>
						<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Siap Pakai
						</span>
					</div>

					<!-- Title & Desc -->
					<div>
						<h3 class="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
							Google Apps Script Builder
						</h3>
						<p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
							Rakit aplikasi Web App SPA, database Google Sheets, dan otomatisasi backend GAS hanya lewat obrolan natural dengan AI dan 1-click deployment.
						</p>
					</div>

					<!-- Feature Chips -->
					<div class="pt-2 flex flex-wrap gap-1.5 text-[11px]">
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Sparkles class="w-3 h-3 text-emerald-400" /> AI Discovery Chat
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Layers class="w-3 h-3 text-teal-400" /> Auto PRD Spec
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Cpu class="w-3 h-3 text-cyan-400" /> Code Studio & Live Preview
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Rocket class="w-3 h-3 text-emerald-400" /> 1-Click Sync Deploy
						</span>
					</div>
				</div>

				<!-- Launch Button -->
				<div class="pt-6">
					<a 
						href="/gas-builder"
						class="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
						<span>Buka GAS Builder</span>
						<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</a>
				</div>
			</div>

			<!-- APP 2: PRD & Flow Builder -->
			<div class="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-sky-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1">
				<div class="space-y-4">
					<!-- Card Header -->
					<div class="flex items-start justify-between">
						<div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
							<Workflow class="w-7 h-7 stroke-[2.2]" />
						</div>
						<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> Tersedia
						</span>
					</div>

					<!-- Title & Desc -->
					<div>
						<h3 class="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
							PRD & Architecture Flow Builder
						</h3>
						<p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
							Visualisasikan alur sistem (system flowcharts), diagram keputusan, dan susun Product Requirements Document terstruktur secara instan.
						</p>
					</div>

					<!-- Feature Chips -->
					<div class="pt-2 flex flex-wrap gap-1.5 text-[11px]">
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Workflow class="w-3 h-3 text-sky-400" /> Interactive Flowcharts
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Layers class="w-3 h-3 text-blue-400" /> Split View Workspace
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<CheckCircle2 class="w-3 h-3 text-teal-400" /> Export Markdown PRD
						</span>
					</div>
				</div>

				<!-- Launch Button -->
				<div class="pt-6">
					<a 
						href="/prd-flow-builder"
						class="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/30 transition-all">
						<span>Buka PRD & Flow Builder</span>
						<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</a>
				</div>
			</div>

			<!-- APP 3: PRD to HTML Studio -->
			<div class="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-violet-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1">
				<div class="space-y-4">
					<!-- Card Header -->
					<div class="flex items-start justify-between">
						<div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
							<LayoutTemplate class="w-7 h-7 stroke-[2.2]" />
						</div>
						<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span> Anti-Slop UI
						</span>
					</div>

					<!-- Title & Desc -->
					<div>
						<h3 class="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
							PRD to HTML Studio
						</h3>
						<p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
							Ubah PRD menjadi Dashboard Aplikasi atau Landing Page interaktif dengan standar desain tinggi tanpa template AI klise.
						</p>
					</div>

					<!-- Feature Chips -->
					<div class="pt-2 flex flex-wrap gap-1.5 text-[11px]">
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Palette class="w-3 h-3 text-violet-400" /> Anti-Slop Directives
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Layers class="w-3 h-3 text-indigo-400" /> Dashboard & Landing
						</span>
						<span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
							<Cpu class="w-3 h-3 text-purple-400" /> Tailwind + Phosphor CDN
						</span>
					</div>
				</div>

				<!-- Launch Button -->
				<div class="pt-6">
					<a 
						href="/prd-to-html"
						class="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-all">
						<span>Buka PRD to HTML</span>
						<ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</a>
				</div>
			</div>
		</div>

		<!-- Recent Projects Quick Launcher -->
		{#if recentProjects.length > 0}
			<div class="pt-6 space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-bold text-white">
						<FolderKanban class="w-4 h-4 text-amber-400" />
						<span>Lanjutkan Proyek Terakhir</span>
					</div>
					<a 
						href="/gas-builder" 
						class="text-xs text-emerald-400 hover:underline flex items-center gap-1">
						<span>Buka Semua di GAS Builder</span>
						<ArrowRight class="w-3 h-3" />
					</a>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each recentProjects as proj}
						<a 
							href="/gas-builder"
							class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition flex flex-col justify-between space-y-3 group">
							<div>
								<div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
									<span>{proj.files.length} file kode</span>
									<span class="flex items-center gap-1 text-[10px]">
										<Clock class="w-3 h-3" />
										{new Date(proj.lastUpdated).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
									</span>
								</div>
								<h4 class="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors mt-1.5 line-clamp-1">
									{proj.prd?.appName || proj.title}
								</h4>
								<p class="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
									{proj.prd?.summary || 'Proyek aplikasi Google Apps Script'}
								</p>
							</div>

							<div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
								<span>Lanjutkan</span>
								<ArrowRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</main>
</div>
