<script lang="ts">
	import { 
		Sparkles, 
		Layers, 
		Code2, 
		Rocket, 
		Settings, 
		Eye, 
		FileSpreadsheet, 
		CheckCircle2,
		Bot,
		FolderKanban,
		Plus,
		ArrowLeft
	} from '@lucide/svelte';

	let { 
		title = 'GAS Builder AI',
		status = 'interview',
		activeTab = 'chat',
		projectCount = 0,
		onTabChange = (tab: string) => {},
		onOpenProjectManager = () => {},
		onCreateNewProject = () => {},
		onOpenSettings = () => {},
		onOpenPreview = () => {},
		onDeploy = () => {},
		canDeploy = false
	} = $props<{
		title?: string;
		status?: 'interview' | 'prd_review' | 'generating_code' | 'code_ready' | 'deploying' | 'deployed';
		activeTab?: string;
		projectCount?: number;
		onTabChange?: (tab: string) => void;
		onOpenProjectManager?: () => void;
		onCreateNewProject?: () => void;
		onOpenSettings?: () => void;
		onOpenPreview?: () => void;
		onDeploy?: () => void;
		canDeploy?: boolean;
	}>();

	const statusLabels: Record<string, { text: string; color: string; dot: string }> = {
		interview: { text: '1. Discovery & Interview', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', dot: 'bg-blue-400' },
		prd_review: { text: '2. Review PRD Spec', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', dot: 'bg-amber-400' },
		generating_code: { text: '3. Generating Code...', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', dot: 'bg-purple-400 animate-ping' },
		code_ready: { text: '4. Code Ready to Deploy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' },
		deploying: { text: '5. Deploying to Google...', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', dot: 'bg-yellow-400 animate-ping' },
		deployed: { text: '🎉 Live & Deployed', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' }
	};
</script>

<header class="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
	<!-- Left: Logo & Project Info -->
	<div class="flex items-center space-x-3 sm:space-x-4">
		<!-- Back to Apps Hub Link -->
		<a 
			href="/"
			title="Kembali ke App Launcher Hub"
			class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 group">
			<ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
			<span class="hidden sm:inline">Apps Hub</span>
		</a>

		<div class="flex items-center space-x-3">
			<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
				<FileSpreadsheet class="w-5 h-5 text-slate-950 stroke-[2.5]" />
			</div>
			<div>
				<div class="flex items-center space-x-2">
					<h1 class="text-sm font-bold text-white tracking-tight max-w-[180px] sm:max-w-[240px] truncate">{title}</h1>
					<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">Studio</span>
				</div>
				<p class="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
					<Bot class="w-3 h-3 text-emerald-400" /> Powered by DeepSeek & GAS API
				</p>
			</div>
		</div>

		<!-- Status Badge -->
		<div class="hidden xl:flex items-center">
			<div class="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 {statusLabels[status]?.color || statusLabels.interview.color}">
				<span class="w-2 h-2 rounded-full {statusLabels[status]?.dot || statusLabels.interview.dot}"></span>
				<span>{statusLabels[status]?.text || statusLabels.interview.text}</span>
			</div>
		</div>
	</div>

	<!-- Center: View Mode Tabs (Desktop) -->
	<div class="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
		<button 
			onclick={() => onTabChange('chat')}
			class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all {activeTab === 'chat' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}">
			<Sparkles class="w-3.5 h-3.5" />
			<span>AI Studio</span>
		</button>
		<button 
			onclick={() => onTabChange('prd')}
			class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all {activeTab === 'prd' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}">
			<Layers class="w-3.5 h-3.5" />
			<span>PRD Spec</span>
		</button>
		<button 
			onclick={() => onTabChange('code')}
			class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all {activeTab === 'code' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}">
			<Code2 class="w-3.5 h-3.5" />
			<span>Code Studio</span>
		</button>
		<button 
			onclick={() => onTabChange('app')}
			class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all {activeTab === 'app' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25' : 'text-cyan-300 hover:text-cyan-200 hover:bg-slate-800/60'}">
			<Eye class="w-3.5 h-3.5 {activeTab === 'app' ? 'text-slate-950' : 'text-cyan-400'}" />
			<span>Tampilan Aplikasi</span>
			{#if canDeploy}
				<span class="w-1.5 h-1.5 rounded-full {activeTab === 'app' ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}"></span>
			{/if}
		</button>
	</div>

	<!-- Right: Actions -->
	<div class="flex items-center space-x-2 sm:space-x-2.5">
		<!-- My Projects Button -->
		<button 
			onclick={onOpenProjectManager}
			class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
			<FolderKanban class="w-3.5 h-3.5 text-amber-400" />
			<span class="hidden sm:inline">Project Saya</span>
			{#if projectCount > 0}
				<span class="px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 text-[10px] font-mono border border-slate-700">
					{projectCount}
				</span>
			{/if}
		</button>

		<!-- + New Project Button -->
		<button 
			onclick={onCreateNewProject}
			title="Buat Project Baru"
			class="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition">
			<Plus class="w-3.5 h-3.5 text-emerald-400" />
			<span class="hidden md:inline">Baru</span>
		</button>

		<!-- Live Preview Button -->
		<button 
			onclick={onOpenPreview}
			title="Simulasi Tampilan Web App"
			class="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
			<Eye class="w-3.5 h-3.5 text-cyan-400" />
			<span class="hidden md:inline">Preview</span>
		</button>

		<!-- Settings / API Keys -->
		<button 
			onclick={onOpenSettings}
			title="Pengaturan API Key"
			class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
			<Settings class="w-4 h-4" />
		</button>

		<!-- 1-Click Deploy Button -->
		<button 
			onclick={onDeploy}
			class="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-lg {canDeploy ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'}">
			<Rocket class="w-3.5 h-3.5 {canDeploy ? 'animate-bounce' : ''}" />
			<span>1-Click Deploy</span>
		</button>
	</div>
</header>
