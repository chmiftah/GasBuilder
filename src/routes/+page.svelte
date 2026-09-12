<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import PRDViewer from '$lib/components/PRDViewer.svelte';
	import CodeStudio from '$lib/components/CodeStudio.svelte';
	import LivePreviewModal from '$lib/components/LivePreviewModal.svelte';
	import DeployModal from '$lib/components/DeployModal.svelte';
	import ApiKeyModal from '$lib/components/ApiKeyModal.svelte';
	import ProjectManagerModal from '$lib/components/ProjectManagerModal.svelte';
	import GenerateProgressModal, { type GenStep } from '$lib/components/GenerateProgressModal.svelte';
	import { 
		getAllProjects, 
		saveProjectToStorage, 
		deleteProjectFromStorage, 
		createNewProjectState, 
		getActiveProjectId, 
		setActiveProjectId 
	} from '$lib/stores/projectStore';
	import type { ProjectState, ChatMessage, PRDSpec, GASFile, FeatureItem } from '$lib/types';

	// Main App State
	let project = $state<ProjectState>(createNewProjectState());
	let allProjects = $state<ProjectState[]>([]);

	// UI Navigation & Modals
	let activeTab = $state<'chat' | 'prd' | 'code'>('chat');
	let isSendingChat = $state(false);
	let isGeneratingCode = $state(false);
	let isPreviewOpen = $state(false);
	let isDeployOpen = $state(false);
	let isSettingsOpen = $state(false);
	let isProjectsModalOpen = $state(false);
	let isGenProgressOpen = $state(false);
	let genActiveStep = $state(0);
	let genMode = $state('');
	let genNotice = $state('');
	let genError = $state('');
	let genSteps = $state<GenStep[]>([
		{ title: 'Fase 1: Validasi & Ekstraksi PRD', desc: 'Membaca skema tabel, kolom, views, dan tema desain...', status: 'waiting' },
		{ title: 'Fase 2: Menghubungi Engine Generator', desc: 'Memproses perakitan kode GAS multi-file...', status: 'waiting' },
		{ title: 'Fase 3: Perakitan Kode Multi-File', desc: 'Menyusun appsscript.json, Code.gs, Setup.gs, & index.html...', status: 'waiting' },
		{ title: 'Fase 4: Verifikasi & Finalisasi Kode', desc: 'Memvalidasi kelengkapan sintaks & RPC Google Apps Script...', status: 'waiting' }
	]);

	// User Settings
	let apiKey = $state('');
	let selectedModel = $state('deepseek-chat');
	let baseUrl = $state('https://api.deepseek.com');

	onMount(() => {
		// Load persisted settings
		const savedKey = localStorage.getItem('deepseek_api_key');
		const savedModel = localStorage.getItem('deepseek_model');
		const savedUrl = localStorage.getItem('ai_base_url');
		if (savedKey) apiKey = savedKey;
		if (savedModel) selectedModel = savedModel;
		if (savedUrl) baseUrl = savedUrl;

		// Load projects list
		allProjects = getAllProjects();
		const activeId = getActiveProjectId();

		if (activeId) {
			const found = allProjects.find((p) => p.id === activeId);
			if (found) {
				project = found;
			}
		} else if (allProjects.length > 0) {
			project = allProjects[0];
		}

		// Clean any duplicate files that may have been stored in project
		if (project.files && project.files.length > 0) {
			const dedupe = new Map<string, typeof project.files[0]>();
			for (const f of project.files) {
				const k = f.name.replace(/\.(html|gs|js|json)$/i, '').toLowerCase();
				if (!dedupe.has(k) || (f.source || '').length >= (dedupe.get(k)!.source || '').length) {
					dedupe.set(k, { ...f, name: f.name.replace(/\.(html|gs|js|json)$/i, '') });
				}
			}
			if (dedupe.size !== project.files.length) {
				project.files = Array.from(dedupe.values());
				if (project.activeFileIndex >= project.files.length) {
					project.activeFileIndex = 0;
				}
				persistCurrentProject();
			}
		}
	});

	function persistCurrentProject() {
		saveProjectToStorage(project);
		allProjects = getAllProjects();
	}

	function handleCreateNewProject() {
		const newProj = createNewProjectState();
		project = newProj;
		persistCurrentProject();
		activeTab = 'chat';
	}

	function handleSelectProject(selected: ProjectState) {
		project = selected;
		setActiveProjectId(selected.id);
		activeTab = selected.files.length > 0 ? 'code' : selected.prd ? 'prd' : 'chat';
	}

	function handleDeleteProject(id: string) {
		allProjects = deleteProjectFromStorage(id);
		if (project.id === id) {
			if (allProjects.length > 0) {
				project = allProjects[0];
				setActiveProjectId(project.id);
			} else {
				handleCreateNewProject();
			}
		}
	}

	async function handleSendMessage(text: string) {
		const userMsg: ChatMessage = {
			id: 'msg-' + Date.now(),
			role: 'user',
			content: text,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};

		project.messages = [...project.messages, userMsg];
		isSendingChat = true;
		persistCurrentProject();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: project.messages
					// apiKey, model, baseUrl are read from server .env — do not override from frontend
				})
			});

			const data = await res.json();
			if (data.error) throw new Error(data.error);

			const aiMsg: ChatMessage = {
				id: 'msg-' + Date.now(),
				role: 'assistant',
				content: data.content,
				suggestedReplies: data.suggestedReplies || [],
				featureRecommendations: data.featureRecommendations || [],
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			};

			project.messages = [...project.messages, aiMsg];

			// If PRD was generated by DeepSeek / AI
			if (data.prd) {
				project.prd = data.prd;
				project.title = data.prd.appName || project.title;
				project.status = 'prd_review';
			}
		} catch (err: any) {
			project.messages = [
				...project.messages,
				{
					id: 'msg-err-' + Date.now(),
					role: 'assistant',
					content: `Mohon maaf, terjadi kendala koneksi: ${err.message}`,
					timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
				}
			];
		} finally {
			isSendingChat = false;
			persistCurrentProject();
		}
	}

	async function handleGenerateCode() {
		if (!project.prd) return;
		isGeneratingCode = true;
		project.status = 'generating_code';
		isGenProgressOpen = true;
		genNotice = '';
		genError = '';
		
		genSteps = [
			{ title: 'Fase 1: Validasi & Ekstraksi PRD', desc: `Membaca ${project.prd.sheets.length} tabel dan view '${project.prd.appName}'...`, status: 'running' },
			{ title: 'Fase 2: Menghubungi Engine Generator', desc: 'Menghubungkan ke AI Gateway / Engine Generator...', status: 'waiting' },
			{ title: 'Fase 3: Perakitan Kode Multi-File', desc: 'Menyusun appsscript.json, Code.gs, Setup.gs, & index.html...', status: 'waiting' },
			{ title: 'Fase 4: Verifikasi & Finalisasi Kode', desc: 'Memvalidasi kelengkapan sintaks & RPC Google Apps Script...', status: 'waiting' }
		];
		genActiveStep = 0;

		try {
			await new Promise(r => setTimeout(r, 350));
			genSteps[0].status = 'done';
			genSteps[1].status = 'running';
			genActiveStep = 1;

			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prd: project.prd
					// apiKey, model, baseUrl are read from server .env — do not override from frontend
				})
			});

			genSteps[1].status = 'done';
			genSteps[2].status = 'running';
			genActiveStep = 2;

			const data = await res.json();
			if (data.error) throw new Error(data.error);

			await new Promise(r => setTimeout(r, 250));
			genSteps[2].status = 'done';
			genSteps[3].status = 'running';
			genActiveStep = 3;

			genMode = data.generatorMode || 'local_engine';
			genNotice = data.notice || '';

			project.files = [...data.files];
			project.activeFileIndex = 0;
			project.status = 'code_ready';

			await new Promise(r => setTimeout(r, 250));
			genSteps[3].status = 'done';
			genActiveStep = 4;
		} catch (err: any) {
			genError = err.message || 'Terjadi kesalahan saat membuat kode.';
			if (genSteps[genActiveStep]) {
				genSteps[genActiveStep].status = 'error';
			}
			project.status = 'prd_review';
		} finally {
			isGeneratingCode = false;
			persistCurrentProject();
		}
	}

	function handleSaveSettings(key: string, mdl: string, url: string) {
		apiKey = key;
		selectedModel = mdl;
		baseUrl = url;
		localStorage.setItem('deepseek_api_key', key);
		localStorage.setItem('deepseek_model', mdl);
		localStorage.setItem('ai_base_url', url);
	}
</script>

<div class="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
	<!-- Top Navigation Bar -->
	<Navbar 
		title={project.prd?.appName || project.title}
		status={project.status}
		{activeTab}
		projectCount={allProjects.length}
		onTabChange={(tab) => activeTab = tab as any}
		onOpenProjectManager={() => isProjectsModalOpen = true}
		onCreateNewProject={handleCreateNewProject}
		onOpenSettings={() => isSettingsOpen = true}
		onOpenPreview={() => isPreviewOpen = true}
		onDeploy={() => isDeployOpen = true}
		canDeploy={project.files.length > 0}
	/>

	<!-- Main Workspace Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left: Chat Studio Panel -->
		<section class="w-full lg:w-[420px] xl:w-[480px] h-[calc(100vh-4rem)] shrink-0 flex flex-col {activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}">
			<ChatPanel 
				messages={project.messages}
				isSending={isSendingChat}
				prd={project.prd}
				onSendMessage={handleSendMessage}
				onViewPrd={() => activeTab = 'prd'}
			/>
		</section>

		<!-- Right: PRD Viewer or Code Studio Area -->
		<section class="flex-1 h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-950/40">
			{#if activeTab === 'prd' || (!project.files.length && activeTab !== 'code')}
				<PRDViewer 
					prd={project.prd}
					{isGeneratingCode}
					onGenerateCode={handleGenerateCode}
					onBackToChat={() => activeTab = 'chat'}
				/>
			{:else}
				<CodeStudio 
					files={project.files}
					prd={project.prd}
					activeFileIndex={project.activeFileIndex}
					onSelectFile={(idx: number) => { project.activeFileIndex = idx; }}
					onCodeChange={(idx: number, newCode: string) => {
						if (project.files[idx]) {
							project.files[idx].source = newCode;
							persistCurrentProject();
						}
					}}
					onFilesUpdated={(newFiles) => {
						project.files = [...newFiles];
						persistCurrentProject();
					}}
					onDeploy={() => isDeployOpen = true}
					onOpenPreview={() => isPreviewOpen = true}
				/>
			{/if}
		</section>
	</div>

	<!-- Modals -->
	<ProjectManagerModal 
		isOpen={isProjectsModalOpen}
		projects={allProjects}
		activeProjectId={project.id}
		onSelectProject={handleSelectProject}
		onCreateNewProject={handleCreateNewProject}
		onDeleteProject={handleDeleteProject}
		onClose={() => isProjectsModalOpen = false}
	/>

	<LivePreviewModal 
		isOpen={isPreviewOpen}
		files={project.files}
		onClose={() => isPreviewOpen = false}
	/>

	<DeployModal 
		isOpen={isDeployOpen}
		files={project.files}
		prd={project.prd}
		scriptId={project.scriptId}
		spreadsheetUrl={project.spreadsheetUrl}
		deployedUrl={project.deployedUrl}
		onDeploySuccess={(res) => {
			if (res.deployedUrl) project.deployedUrl = res.deployedUrl;
			if (res.spreadsheetUrl) project.spreadsheetUrl = res.spreadsheetUrl;
			if (res.scriptId) project.scriptId = res.scriptId;
			project.status = 'deployed';
			persistCurrentProject();
		}}
		onClose={() => isDeployOpen = false}
	/>

	<ApiKeyModal 
		isOpen={isSettingsOpen}
		{apiKey}
		{baseUrl}
		model={selectedModel}
		onSave={handleSaveSettings}
		onClose={() => isSettingsOpen = false}
	/>

	<GenerateProgressModal 
		isOpen={isGenProgressOpen}
		steps={genSteps}
		activeStep={genActiveStep}
		generatorMode={genMode}
		notice={genNotice}
		error={genError}
		onClose={() => {
			isGenProgressOpen = false;
			if (project.files.length > 0) activeTab = 'code';
		}}
	/>
</div>
