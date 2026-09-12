<script lang="ts">
	import { 
		FileText, 
		Layers, 
		Database, 
		Layout, 
		Cpu, 
		ShieldCheck, 
		Sparkles, 
		CheckCircle2, 
		ArrowRight, 
		Edit3,
		ListOrdered,
		Milestone,
		CheckSquare
	} from '@lucide/svelte';
	import type { PRDSpec } from '$lib/types';

	let {
		prd,
		isGeneratingCode = false,
		onGenerateCode = () => {},
		onBackToChat = () => {}
	} = $props<{
		prd: PRDSpec | null;
		isGeneratingCode?: boolean;
		onGenerateCode?: () => void;
		onBackToChat?: () => void;
	}>();

	let activeTab = $state<'overview' | 'schema' | 'ui' | 'phases' | 'backend'>('overview');
</script>

<div class="flex flex-col h-full bg-slate-900/40">
	{#if !prd}
		<!-- Empty State when PRD is not yet created -->
		<div class="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
			<div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
				<FileText class="w-8 h-8" />
			</div>
			<div class="max-w-md space-y-1.5">
				<h3 class="text-sm font-bold text-white">Belum Ada PRD Terbentuk</h3>
				<p class="text-xs text-slate-400 leading-relaxed">
					Mulai percakapan di tab <strong>AI Interview</strong>. AI akan mengumpulkan spesifikasi kebutuhan Anda dan secara otomatis menyusun PRD ini.
				</p>
			</div>
			<button 
				onclick={onBackToChat}
				class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20">
				Mulai Diskusi dengan AI
			</button>
		</div>
	{:else}
		<!-- PRD Header & Actions -->
		<div class="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="space-y-1">
				<div class="flex items-center space-x-2.5">
					<span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
						PRD Spec
					</span>
					<h2 class="text-base font-extrabold text-white tracking-tight">{prd.appName}</h2>
				</div>
				<p class="text-xs text-slate-400">{prd.tagline || prd.summary}</p>
			</div>

			<!-- Generate Action Button -->
			<button 
				onclick={onGenerateCode}
				disabled={isGeneratingCode}
				class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">
				{#if isGeneratingCode}
					<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
					<span>Merakit Kode GAS Sesuai Fase...</span>
				{:else}
					<Sparkles class="w-4 h-4" />
					<span>Setujui & Generate Code</span>
					<ArrowRight class="w-4 h-4" />
				{/if}
			</button>
		</div>

		<!-- Sub Navigation Tabs -->
		<div class="px-5 border-b border-slate-800 bg-slate-950/20 flex space-x-2 overflow-x-auto">
			<button 
				onclick={() => activeTab = 'overview'}
				class="py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap {activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
				<Layers class="w-3.5 h-3.5" />
				<span>Overview & Workflow</span>
			</button>
			<button 
				onclick={() => activeTab = 'schema'}
				class="py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap {activeTab === 'schema' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
				<Database class="w-3.5 h-3.5" />
				<span>Database Sheets ({prd.sheets?.length || 1})</span>
			</button>
			<button 
				onclick={() => activeTab = 'ui'}
				class="py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap {activeTab === 'ui' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
				<Layout class="w-3.5 h-3.5" />
				<span>UI & Views ({prd.uiFeatures?.views?.length || prd.uiUxSpec?.views?.length || 1})</span>
			</button>
			<button 
				onclick={() => activeTab = 'phases'}
				class="py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap {activeTab === 'phases' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
				<Milestone class="w-3.5 h-3.5" />
				<span>Fase Implementasi (5 Step)</span>
			</button>
			<button 
				onclick={() => activeTab = 'backend'}
				class="py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap {activeTab === 'backend' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
				<Cpu class="w-3.5 h-3.5" />
				<span>Backend Functions</span>
			</button>
		</div>

		<!-- Tab Content Area -->
		<div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
			{#if activeTab === 'overview'}
				<!-- Summary Card -->
				<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
					<h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
						<FileText class="w-4 h-4 text-emerald-400" /> Ringkasan Proyek
					</h3>
					<p class="text-xs text-slate-300 leading-relaxed">{prd.summary}</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
						<div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
							<p class="text-[10px] text-slate-400 uppercase font-semibold">Tipe Aplikasi</p>
							<p class="text-xs font-bold text-emerald-400 uppercase mt-0.5">{prd.appType} (HtmlService Web App)</p>
						</div>
						<div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
							<p class="text-[10px] text-slate-400 uppercase font-semibold">Database Google Sheets</p>
							<p class="text-xs font-bold text-white mt-0.5">{prd.spreadsheetName}</p>
						</div>
					</div>
				</div>

				<!-- Workflow Steps -->
				{#if prd.workflowSummary && prd.workflowSummary.length > 0}
					<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
						<h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<ListOrdered class="w-4 h-4 text-teal-400" /> Alur Kerja Aplikasi (Workflow)
						</h3>
						<div class="space-y-2.5">
							{#each prd.workflowSummary as step, idx}
								<div class="flex items-start space-x-3 text-xs text-slate-300">
									<div class="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
										{idx + 1}
									</div>
									<p class="pt-0.5">{step}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Permissions Scopes -->
				{#if prd.requiredScopes && prd.requiredScopes.length > 0}
					<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
						<h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<ShieldCheck class="w-4 h-4 text-cyan-400" /> Izin Akses Google (OAuth Scopes)
						</h3>
						<div class="flex flex-wrap gap-2">
							{#each prd.requiredScopes as scope}
								<span class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
									{scope}
								</span>
							{/each}
						</div>
					</div>
				{/if}

			{:else if activeTab === 'schema'}
				<!-- Sheet Database Schemas -->
				<div class="space-y-5">
					{#each prd.sheets as sheet}
						<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2.5">
									<div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
										<Database class="w-4 h-4" />
									</div>
									<div>
										<h4 class="text-xs font-bold text-white">{sheet.name}</h4>
										<p class="text-[11px] text-slate-400">{sheet.description}</p>
									</div>
								</div>
								<span class="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-semibold">
									{sheet.headers.length} Kolom Header
								</span>
							</div>

							<!-- Columns Table -->
							<div class="overflow-x-auto rounded-xl border border-slate-800/80">
								<table class="w-full text-left text-xs">
									<thead class="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
										<tr>
											<th class="py-2.5 px-3 w-12 text-center">No</th>
											<th class="py-2.5 px-3">Nama Header Kolom</th>
											<th class="py-2.5 px-3">Tipe Data</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-800 text-slate-200">
										{#each sheet.headers as header, idx}
											<tr class="hover:bg-slate-800/30">
												<td class="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
												<td class="py-2.5 px-3 font-semibold text-emerald-300 font-mono text-[11px]">{header}</td>
												<td class="py-2.5 px-3 text-slate-400 text-[11px]">
													{#if header.toLowerCase().includes('id')}
														<span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Primary Key (String)</span>
													{:else if header.toLowerCase().includes('date') || header.toLowerCase().includes('tanggal') || header.toLowerCase().includes('timestamp')}
														<span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Datetime</span>
													{:else if header.toLowerCase().includes('status')}
														<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Enum / Status</span>
													{:else if header.toLowerCase().includes('jumlah') || header.toLowerCase().includes('nominal') || header.toLowerCase().includes('total')}
														<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Number / Currency</span>
													{:else}
														<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400">Text / String</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
				</div>

			{:else if activeTab === 'ui'}
				<!-- UI Layout & Views -->
				<div class="space-y-5">
					{#if prd.uiUxSpec?.designSystem || prd.uiFeatures?.theme}
						<!-- Design System Card -->
						<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
							<div class="flex items-center space-x-2">
								<Sparkles class="w-4 h-4 text-emerald-400" />
								<h4 class="text-xs font-bold text-white uppercase tracking-wider">Design System & Theme Tokens</h4>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
								<div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
									<span class="text-[10px] text-slate-500 font-semibold block">Palette Tema</span>
									<span class="text-xs font-bold text-emerald-400 mt-0.5 block">{prd.uiUxSpec?.designSystem?.themeColor || prd.uiFeatures?.theme || 'Vibrant Emerald / Slate Pro'}</span>
								</div>
								<div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
									<span class="text-[10px] text-slate-500 font-semibold block">Tipografi Font</span>
									<span class="text-xs font-bold text-cyan-400 mt-0.5 block">{prd.uiUxSpec?.designSystem?.fontFamily || 'Plus Jakarta Sans'}</span>
								</div>
								<div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
									<span class="text-[10px] text-slate-500 font-semibold block">Gaya Visual</span>
									<span class="text-xs font-bold text-purple-400 mt-0.5 block">{prd.uiUxSpec?.designSystem?.visualStyle || 'Glassmorphism Dark Enterprise'}</span>
								</div>
							</div>
						</div>
					{/if}

					{#if prd.navigation?.sidebar || prd.uiUxSpec?.navigation?.sidebar}
						<!-- Navigation Tree Card -->
						<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
							<h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
								<Layout class="w-4 h-4 text-cyan-400" /> Struktur Modul Navigasi Sidebar
							</h4>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
								{#each (prd.navigation?.sidebar || prd.uiUxSpec?.navigation?.sidebar || []) as item}
									<div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-white flex items-center gap-2">
												<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
												{item.title}
											</span>
											{#if 'children' in item}
												<span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Modul Grup</span>
											{:else}
												<span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">View Link</span>
											{/if}
										</div>

										{#if 'children' in item && item.children}
											<div class="pl-3 border-l-2 border-slate-800 space-y-1.5 pt-1">
												{#each item.children as child}
													<div class="text-[11px] text-slate-300 flex items-center justify-between">
														<span>↳ {child.title}</span>
														<span class="text-[10px] text-slate-500 font-mono">#{child.targetView}</span>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- View Architectures -->
					<div class="space-y-4">
						<h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<Layers class="w-4 h-4 text-teal-400" /> Arsitektur Tampilan / Layar (Views)
						</h4>

						{#if prd.uiUxSpec?.views && prd.uiUxSpec.views.length > 0}
							{#each prd.uiUxSpec.views as view}
								<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
									<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
										<div class="flex items-center space-x-2.5">
											<div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
												<Layout class="w-4 h-4" />
											</div>
											<div>
												<h4 class="text-xs font-bold text-white">{view.title}</h4>
												<p class="text-[11px] text-slate-400">{view.description}</p>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
												{view.type.replace(/_/g, ' ')}
											</span>
											<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
												Tabel: {view.primaryTable}
											</span>
										</div>
									</div>

									{#if view.features && view.features.length > 0}
										<div class="pt-1">
											<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
												{#each view.features as f}
													<div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
														<CheckCircle2 class="w-3 h-3 text-emerald-400 shrink-0" />
														<span>{f}</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						{:else}
							{#each prd.uiFeatures?.views || [] as view}
								<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
									<div class="flex items-center space-x-2.5">
										<div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
											<Layout class="w-4 h-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-white">{view.title}</h4>
											<p class="text-[11px] text-slate-400">{view.description}</p>
										</div>
									</div>
									<div class="pt-2">
										<p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Elemen & Komponen UI:</p>
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{#each view.elements as el}
												<div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
													<CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
													<span>{el}</span>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>

			{:else if activeTab === 'phases'}
				<!-- Implementation Phases Roadmap -->
				<div class="space-y-4">
					<div class="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
						<div class="flex items-center space-x-2">
							<Milestone class="w-4 h-4 text-emerald-400" />
							<h4 class="text-xs font-bold text-white uppercase tracking-wider">Roadmap & 5 Fase Implementasi Kode</h4>
						</div>
						<p class="text-xs text-slate-400 mt-1">
							Generator kode akan membaca dan mengeksekusi secara ketat setiap fase di bawah ini untuk merakit paket Web App Google Apps Script.
						</p>
					</div>

					{#each (prd.implementationPhases || [
						{
							phaseNumber: 1,
							name: 'Fase 1: Theme & Design System Tokens',
							description: 'Penerapan palet tema (Clean Light / Dark), tipografi font, dan komponen kartu',
							deliverables: ['Tailwind config tema warna', 'Styling body & glass-card', 'Responsiveness & shadows']
						},
						{
							phaseNumber: 2,
							name: 'Fase 2: Navigation & Modular Sidebar',
							description: 'Pengelompokan menu navigasi hirarkis berdasarkan modul bisnis',
							deliverables: ['Sidebar modul operasional', 'Sidebar modul data master', 'User profile & quick logout']
						},
						{
							phaseNumber: 3,
							name: 'Fase 3: View-by-View UI & Dynamic Components',
							description: 'Pembuatan seluruh layar view dan elemen visual spesifik dari PRD',
							deliverables: ['Layar Login (jika diminta)', 'Dashboard KPI status + Chart.js', 'Layar manajemen data + modal CRUD', 'Modal edit profil user']
						},
						{
							phaseNumber: 4,
							name: 'Fase 4: Database Multi-Sheet & Backend RPC Engine',
							description: 'Implementasi Code.gs untuk seluruh tabel database dan fungsi RPC',
							deliverables: ['doGet Web App handler', 'getTableData dinamis untuk semua sheet', 'create/update/delete record RPC', 'getDashboardStats agregasi status']
						},
						{
							phaseNumber: 5,
							name: 'Fase 5: Automated Seeder & Mock Data',
							description: 'Inisialisasi Setup.gs untuk pembuatan tab sheet dan pengisian sample data',
							deliverables: ['initialSetup() multi-tabel', 'Header styling & format kolom', 'Sample data realistis sesuai domain']
						}
					]) as phase}
						<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2.5">
									<div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center font-mono">
										{phase.phaseNumber}
									</div>
									<div>
										<h4 class="text-xs font-bold text-white">{phase.name}</h4>
										<p class="text-[11px] text-slate-400">{phase.description}</p>
									</div>
								</div>
								<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
									Ready to Build
								</span>
							</div>

							{#if phase.deliverables && phase.deliverables.length > 0}
								<div class="pt-2 border-t border-slate-800/80">
									<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Deliverables & Output:</p>
									<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
										{#each phase.deliverables as d}
											<div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
												<CheckSquare class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
												<span class="truncate">{d}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

			{:else if activeTab === 'backend'}
				<!-- Backend Functions -->
				<div class="space-y-4">
					{#each prd.backendFunctions || [] as fn}
						<div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
										function
									</span>
									<h4 class="text-xs font-bold font-mono text-emerald-300">{fn.name}({fn.params?.join(', ') || ''})</h4>
								</div>
								<span class="text-[11px] text-slate-400 font-mono">Return: {fn.returns}</span>
							</div>
							<p class="text-xs text-slate-300 leading-relaxed">{fn.description}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
