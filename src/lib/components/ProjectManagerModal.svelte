<script lang="ts">
	import { 
		X, 
		FolderKanban, 
		Plus, 
		ExternalLink, 
		FileSpreadsheet, 
		Code2, 
		Trash2, 
		Sparkles, 
		Clock, 
		CheckCircle2, 
		ArrowRight,
		Search,
		FileText
	} from '@lucide/svelte';
	import type { ProjectState } from '$lib/types';

	let {
		isOpen = false,
		projects = [],
		activeProjectId = '',
		onSelectProject = (project: ProjectState) => {},
		onCreateNewProject = () => {},
		onDeleteProject = (id: string) => {},
		onClose = () => {}
	} = $props<{
		isOpen: boolean;
		projects: ProjectState[];
		activeProjectId: string;
		onSelectProject: (project: ProjectState) => void;
		onCreateNewProject: () => void;
		onDeleteProject: (id: string) => void;
		onClose: () => void;
	}>();

	let searchQuery = $state('');

	const filteredProjects = $derived(
		projects.filter((p: ProjectState) => {
			const q = searchQuery.toLowerCase();
			const title = (p.title || p.prd?.appName || '').toLowerCase();
			const desc = (p.prd?.summary || '').toLowerCase();
			return title.includes(q) || desc.includes(q);
		})
	);

	function formatDate(iso: string): string {
		try {
			const d = new Date(iso);
			return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
		} catch (e) {
			return '-';
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'deployed':
				return { label: 'Live Deployed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
			case 'code_ready':
				return { label: 'Code Ready', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
			case 'prd_review':
				return { label: 'PRD Ready', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
			default:
				return { label: 'In Progress', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
		<div class="glass-panel w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
						<FolderKanban class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white flex items-center gap-2">
							<span>Manajemen Project GAS Saya</span>
							<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
								{projects.length} Proyek
							</span>
						</h3>
						<p class="text-xs text-slate-400">Buka kembali, perbarui fitur dengan AI, atau kelola deployment live</p>
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<button 
						onclick={() => { onCreateNewProject(); onClose(); }}
						class="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition transform active:scale-95">
						<Plus class="w-4 h-4" />
						<span>+ Project Baru</span>
					</button>
					<button 
						onclick={onClose}
						class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Search Toolbar -->
			<div class="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center">
				<div class="relative w-full max-w-md">
					<Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
					<input 
						type="text" 
						bind:value={searchQuery}
						placeholder="Cari project berdasarkan nama atau deskripsi..." 
						class="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
					/>
				</div>
			</div>

			<!-- Project Cards List -->
			<div class="flex-1 overflow-y-auto p-5 sm:p-6">
				{#if filteredProjects.length === 0}
					<div class="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
						<div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
							<FolderKanban class="w-8 h-8" />
						</div>
						<div class="max-w-md space-y-1.5">
							<h3 class="text-sm font-bold text-white">Belum Ada Project yang Ditemukan</h3>
							<p class="text-xs text-slate-400">
								{#if searchQuery}
									Tidak ada project yang cocok dengan kata kunci pencarian Anda.
								{:else}
									Mulai buat aplikasi Google Apps Script pertama Anda sekarang!
								{/if}
							</p>
						</div>
						<button 
							onclick={() => { onCreateNewProject(); onClose(); }}
							class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20">
							+ Buat Project Pertama
						</button>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each filteredProjects as proj}
							{@const badge = getStatusBadge(proj.status)}
							{@const isActive = proj.id === activeProjectId}
							<div class="glass-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all hover:border-slate-700 {isActive ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800/80'}">
								
								<!-- Top Info -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border {badge.class}">
											{badge.label}
										</span>
										<span class="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
											<Clock class="w-3 h-3" />
											{formatDate(proj.lastUpdated)}
										</span>
									</div>

									<h4 class="text-sm font-bold text-white tracking-tight flex items-center gap-2">
										<span>{proj.prd?.appName || proj.title}</span>
										{#if isActive}
											<span class="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">Aktif</span>
										{/if}
									</h4>
									<p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
										{proj.prd?.summary || 'Project otomatisasi Google Apps Script.'}
									</p>
								</div>

								<!-- Links & Actions -->
								<div class="space-y-3 pt-2 border-t border-slate-800/80">
									<!-- External Links if deployed -->
									{#if proj.deployedUrl || proj.spreadsheetUrl}
										<div class="flex flex-wrap gap-2 text-[11px]">
											{#if proj.deployedUrl}
												<a 
													href={proj.deployedUrl} 
													target="_blank" 
													class="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition">
													<ExternalLink class="w-3 h-3" />
													<span>Live Web App</span>
												</a>
											{/if}
											{#if proj.spreadsheetUrl}
												<a 
													href={proj.spreadsheetUrl} 
													target="_blank" 
													class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition">
													<FileSpreadsheet class="w-3 h-3 text-emerald-400" />
													<span>Spreadsheet DB</span>
												</a>
											{/if}
											{#if proj.scriptId}
												<a 
													href={`https://script.google.com/d/${proj.scriptId}/edit`} 
													target="_blank" 
													class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition">
													<Code2 class="w-3 h-3 text-cyan-400" />
													<span>Script Editor</span>
												</a>
											{/if}
										</div>
									{/if}

									<!-- Bottom Buttons -->
									<div class="flex items-center justify-between pt-1">
										<button 
											onclick={() => { onSelectProject(proj); onClose(); }}
											class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
											<span>Buka di Studio</span>
											<ArrowRight class="w-3 h-3 text-emerald-400" />
										</button>

										<button 
											onclick={() => {
												if (confirm(`Hapus project "${proj.prd?.appName || proj.title}"?`)) {
													onDeleteProject(proj.id);
												}
											}}
											title="Hapus Project"
											class="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition">
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
