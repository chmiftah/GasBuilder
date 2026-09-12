<script lang="ts">
	import { 
		X, 
		Rocket, 
		CheckCircle2, 
		ExternalLink, 
		FileSpreadsheet, 
		Code2, 
		Copy, 
		Check, 
		Sparkles, 
		Layers,
		ArrowRight,
		ShieldCheck,
		AlertCircle,
		LogIn
	} from '@lucide/svelte';
	import type { GASFile, PRDSpec, DeployProgress } from '$lib/types';
	import confetti from 'canvas-confetti';
	import { onMount } from 'svelte';

	let {
		isOpen = false,
		files = [],
		prd = null,
		scriptId = undefined,
		spreadsheetUrl = undefined,
		deployedUrl = undefined,
		onDeploySuccess = (result: any) => {},
		onClose = () => {}
	} = $props<{
		isOpen: boolean;
		files: GASFile[];
		prd: PRDSpec | null;
		scriptId?: string;
		spreadsheetUrl?: string;
		deployedUrl?: string;
		onDeploySuccess?: (result: any) => void;
		onClose: () => void;
	}>();

	let deployMode = $state<'1click' | 'manual'>('1click');
	let isDeploying = $state(false);
	let currentStep = $state(0);
	let accessToken = $state<string | null>(null);
	let isNewProjectOverride = $state(false);
	let deployResult = $state<{
		success: boolean;
		deployedUrl?: string;
		spreadsheetUrl?: string;
		scriptUrl?: string;
		isSimulation?: boolean;
		error?: string;
	} | null>(null);

	let copiedUrl = $state(false);

	const isUpdateMode = $derived(Boolean(scriptId && !isNewProjectOverride));

	const steps = $derived(isUpdateMode ? [
		{ title: 'Inisialisasi & Verifikasi Izin', desc: 'Menghubungkan ke Google Workspace API' },
		{ title: 'Database Spreadsheet', desc: spreadsheetUrl ? 'Menggunakan database Spreadsheet yang sudah ada' : 'Menyiapkan database spreadsheet' },
		{ title: 'Project Apps Script', desc: `Sinkronisasi ke project script (${scriptId})` },
		{ title: 'Upload & Update File Kode', desc: 'Sinkronisasi pembaruan Code.gs, Setup.gs, index.html & manifest' },
		{ title: 'Update Deployment Web App', desc: 'Memperbarui versi Web App aktif (URL tetap sama)' }
	] : [
		{ title: 'Inisialisasi & Verifikasi Izin', desc: 'Menghubungkan ke Google Workspace API' },
		{ title: 'Membuat Database Spreadsheet', desc: 'Menyiapkan tabel & kolom header otomatis' },
		{ title: 'Membuat Project Apps Script', desc: 'Mendaftarkan project script baru di Google Drive' },
		{ title: 'Upload File Code & Manifest', desc: 'Sinkronisasi Code.gs, Setup.gs, index.html & manifest' },
		{ title: 'Menerbitkan Deployment Web App', desc: 'Generate URL live /exec publik' }
	]);

	onMount(() => {
		// Listen for OAuth success message from callback popup window
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token) {
				accessToken = event.data.token;
				sessionStorage.setItem('google_access_token', event.data.token);
				executeDeployment(event.data.token);
			}
		};

		window.addEventListener('message', handleMessage);
		const savedToken = sessionStorage.getItem('google_access_token');
		if (savedToken) accessToken = savedToken;

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	});

	function triggerGoogleAuth() {
		const width = 500;
		const height = 650;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;
		
		window.open(
			'/api/auth/google',
			'Google OAuth Authorization',
			`width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
		);
	}

	async function start1ClickDeploy() {
		if (isDeploying) return;
		
		// If we don't have an access token, trigger Google OAuth popup first
		if (!accessToken) {
			triggerGoogleAuth();
			return;
		}

		executeDeployment(accessToken);
	}

	async function executeDeployment(token: string) {
		isDeploying = true;
		deployResult = null;
		currentStep = 0;

		try {
			// Visual step progression
			currentStep = 1;
			await new Promise((r) => setTimeout(r, 400));
			currentStep = 2;

			// Deduplicate files by base name before sending
			const cleanFilesMap = new Map<string, GASFile>();
			for (const f of files) {
				const baseKey = f.name.replace(/\.(html|gs|js|json)$/i, '').toLowerCase();
				const existing = cleanFilesMap.get(baseKey);
				if (!existing || (f.source || '').length >= (existing.source || '').length) {
					cleanFilesMap.set(baseKey, {
						...f,
						name: f.name.replace(/\.(html|gs|js|json)$/i, '')
					});
				}
			}
			const uploadableFiles = Array.from(cleanFilesMap.values());

			const res = await fetch('/api/deploy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accessToken: token,
					files: uploadableFiles,
					prd,
					scriptId: isUpdateMode ? scriptId : undefined,
					spreadsheetUrl: isUpdateMode ? spreadsheetUrl : undefined,
					isSimulation: false // Live deploy to Google Account!
				})
			});

			currentStep = 3;
			await new Promise((r) => setTimeout(r, 300));
			currentStep = 4;

			const data = await res.json();
			if (data.success) {
				deployResult = data;
				currentStep = steps.length;
				triggerConfetti();
				onDeploySuccess(data);
			} else {
				deployResult = { success: false, error: data.error };
			}
		} catch (err: any) {
			deployResult = { success: false, error: err.message };
		} finally {
			isDeploying = false;
		}
	}

	function triggerConfetti() {
		try {
			confetti({
				particleCount: 100,
				spread: 70,
				origin: { y: 0.6 }
			});
		} catch (e) {}
	}

	function copyUrl(url: string) {
		navigator.clipboard.writeText(url);
		copiedUrl = true;
		setTimeout(() => (copiedUrl = false), 2000);
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
		<div class="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
			<!-- Header -->
			<div class="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-tr {isUpdateMode ? 'from-teal-500 to-emerald-400' : 'from-emerald-500 to-teal-400'} flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
						<Rocket class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white flex items-center gap-2">
							<span>{isUpdateMode ? 'Sinkronisasi / Update Google Apps Script' : 'Google Apps Script Deployment Hub'}</span>
							{#if accessToken}
								<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
									<Check class="w-3 h-3" /> Akun Google Terhubung
								</span>
							{/if}
						</h3>
						<p class="text-xs text-slate-400">
							{isUpdateMode ? 'Perbarui project script & web app yang sudah ada tanpa menduplikasi data' : 'Terbitkan Web App langsung ke akun Google Workspace Anda'}
						</p>
					</div>
				</div>
				<button 
					onclick={onClose}
					class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Tabs Toggle: 1-Click vs Manual -->
			<div class="px-5 pt-3 pb-1 border-b border-slate-800/80 bg-slate-950/40 flex space-x-3">
				<button 
					onclick={() => deployMode = '1click'}
					class="pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition {deployMode === '1click' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
					<Sparkles class="w-3.5 h-3.5" />
					<span>{isUpdateMode ? '1-Click Update Otomatis' : '1-Click Deploy Otomatis (Rekomendasi)'}</span>
				</button>
				<button 
					onclick={() => deployMode = 'manual'}
					class="pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition {deployMode === 'manual' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
					<Layers class="w-3.5 h-3.5" />
					<span>Panduan Pasang Manual</span>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
				{#if deployMode === '1click'}
					{#if !deployResult?.success}
						<!-- Deployment Steps & Trigger -->
						<div class="space-y-4">
							{#if scriptId}
								<!-- Existing Project Sync Banner -->
								<div class="p-3.5 rounded-xl {isUpdateMode ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-slate-900/80 border border-slate-800'} text-xs transition">
									<div class="flex items-start justify-between gap-3">
										<div class="space-y-1">
											<div class="flex items-center gap-2">
												<span class="w-2 h-2 rounded-full {isUpdateMode ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'}"></span>
												<span class="font-bold {isUpdateMode ? 'text-teal-300' : 'text-slate-300'}">
													{isUpdateMode ? 'Mode Update / Sinkronisasi Aktif' : 'Mode Buat Proyek Baru'}
												</span>
											</div>
											<p class="text-[11px] text-slate-400 leading-relaxed">
												{#if isUpdateMode}
													Kode akan diperbarui langsung ke project script yang ada. <strong>URL Web App dan database Spreadsheet Anda tidak akan berubah!</strong>
												{:else}
													Akan membuat Google Spreadsheet dan Project Apps Script baru yang terpisah.
												{/if}
											</p>
											{#if isUpdateMode}
												<div class="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
													<span>Script ID: <span class="text-teal-300 font-semibold">{scriptId}</span></span>
													{#if spreadsheetUrl}
														<span>•</span>
														<a href={spreadsheetUrl} target="_blank" class="text-blue-400 hover:underline flex items-center gap-1">
															Database Spreadsheet <ExternalLink class="w-2.5 h-2.5" />
														</a>
													{/if}
												</div>
											{/if}
										</div>

										<button
											onclick={() => isNewProjectOverride = !isNewProjectOverride}
											type="button"
											class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/70 text-[11px] font-medium shrink-0 transition">
											{isUpdateMode ? 'Buat Baru Saja' : 'Gunakan Project Lama'}
										</button>
									</div>
								</div>
							{:else}
								<div class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
									<ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
									<div>
										<p class="font-bold text-white">Otomatisasi Penuh via Google Apps Script API</p>
										<p class="text-slate-400 mt-0.5">Sistem akan membuat Spreadsheet database, mendaftarkan project GAS, mengunggah kode frontend & backend, dan mengaktifkan Web App secara live.</p>
									</div>
								</div>
							{/if}

							<!-- Steps List -->
							<div class="space-y-2.5 pt-2">
								{#each steps as step, idx}
									<div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between {idx === currentStep && isDeploying ? 'border-emerald-500/50 bg-emerald-500/5' : ''}">
										<div class="flex items-center space-x-3">
											<div class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold {idx < currentStep ? 'bg-emerald-500 text-slate-950' : idx === currentStep && isDeploying ? 'border-2 border-emerald-400 text-emerald-400 animate-spin' : 'bg-slate-800 text-slate-500'}">
												{#if idx < currentStep}
													<Check class="w-3.5 h-3.5 stroke-[3]" />
												{:else if idx === currentStep && isDeploying}
													•
												{:else}
													{idx + 1}
												{/if}
											</div>
											<div>
												<p class="text-xs font-semibold {idx <= currentStep ? 'text-white' : 'text-slate-500'}">{step.title}</p>
												<p class="text-[11px] text-slate-500">{step.desc}</p>
											</div>
										</div>
										{#if idx < currentStep}
											<span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selesai</span>
										{:else if idx === currentStep && isDeploying}
											<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">Memproses...</span>
										{/if}
									</div>
								{/each}
							</div>

							{#if deployResult?.error}
								<div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
									<div class="flex items-start gap-2.5">
										<AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
										<div class="space-y-1">
											<p class="font-bold text-rose-200">Deployment Gagal</p>
											{#if deployResult.error.includes('UNAUTHENTICATED') || deployResult.error.includes('401')}
												<p class="text-[11px] text-rose-300/90 leading-relaxed">
													Token autentikasi Google telah kadaluarsa atau Google Apps Script API belum diaktifkan di akun Google Anda.
												</p>
											{:else}
												<p class="text-[11px] text-rose-300/90 font-mono">{deployResult.error}</p>
											{/if}
										</div>
									</div>

									{#if deployResult.error.includes('UNAUTHENTICATED') || deployResult.error.includes('401')}
										<div class="pt-2 border-t border-rose-500/20 flex flex-wrap gap-2">
											<button 
												onclick={triggerGoogleAuth}
												class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] flex items-center gap-1.5 transition">
												<LogIn class="w-3 h-3" />
												<span>Login Ulang Akun Google</span>
											</button>
											<a 
												href="https://script.google.com/home/usersettings" 
												target="_blank" 
												class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 transition border border-slate-700">
												<ExternalLink class="w-3 h-3" />
												<span>Cek Pengaturan Apps Script API (ON)</span>
											</a>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Launch Deploy Button -->
							<div class="pt-3">
								<button 
									onclick={start1ClickDeploy}
									disabled={isDeploying}
									class="w-full py-3 rounded-xl bg-gradient-to-r {isUpdateMode ? 'from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300' : 'from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300'} text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50">
									{#if isDeploying}
										<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
										<span>{isUpdateMode ? 'Sedang Menyinkronkan ke Google Apps Script...' : 'Sedang Menerbitkan ke Google...'}</span>
									{:else if !accessToken}
										<LogIn class="w-4 h-4" />
										<span>Hubungkan Akun Google & {isUpdateMode ? 'Sinkronkan' : '1-Click Deploy'}</span>
									{:else}
										<Rocket class="w-4 h-4" />
										<span>{isUpdateMode ? 'Mulai Sinkronisasi / Update Sekarang' : 'Mulai 1-Click Deploy Sekarang'}</span>
									{/if}
								</button>
							</div>
						</div>
					{:else}
						<!-- Deployment Success View! -->
						<div class="text-center py-4 space-y-5">
							<div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
								<CheckCircle2 class="w-9 h-9" />
							</div>

							<div class="space-y-1">
								<h3 class="text-base font-extrabold text-white">
									{isUpdateMode ? '🎉 Sinkronisasi Web App Berhasil Diperbarui!' : '🎉 Web App Google Apps Script Berhasil Terbit!'}
								</h3>
								<p class="text-xs text-slate-400">
									{isUpdateMode ? 'Versi terbaru sudah aktif di Google Apps Script. URL Web App dan database spreadsheet Anda tetap sama.' : 'Aplikasi Anda sekarang sudah live di akun Google Anda dan terhubung ke Spreadsheet database.'}
								</p>
							</div>

							<!-- Live Web App Link Card -->
							<div class="glass-card rounded-2xl p-4 border border-emerald-500/30 text-left space-y-2">
								<p class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">URL Web App Live (/exec)</p>
								<div class="flex items-center space-x-2">
									<input 
										type="text" 
										readonly 
										value={deployResult.deployedUrl} 
										class="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none"
									/>
									<button 
										onclick={() => copyUrl(deployResult?.deployedUrl || '')}
										class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
										{#if copiedUrl}
											<Check class="w-3.5 h-3.5 text-emerald-400" />
											<span class="text-emerald-400">Tersalin</span>
										{:else}
											<Copy class="w-3.5 h-3.5" />
											<span>Salin</span>
										{/if}
									</button>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
								<a 
									href={deployResult.deployedUrl} 
									target="_blank" 
									class="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition">
									<span>Buka Web App</span>
									<ExternalLink class="w-3.5 h-3.5" />
								</a>
								{#if deployResult.spreadsheetUrl}
									<a 
										href={deployResult.spreadsheetUrl} 
										target="_blank" 
										class="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition">
										<FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
										<span>Buka Spreadsheet DB</span>
									</a>
								{/if}
							</div>
						</div>
					{/if}
				{:else}
					<!-- Manual Setup Guide -->
					<div class="space-y-4 text-xs text-slate-300">
						<div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
							<h4 class="font-bold text-white flex items-center gap-2">
								<span class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">1</span>
								Buka Google Apps Script Editor
							</h4>
							<p class="text-slate-400">Kunjungi <a href="https://script.google.com" target="_blank" class="text-emerald-400 underline">script.google.com</a> dan klik <strong>+ Project Baru</strong>.</p>
						</div>

						<div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
							<h4 class="font-bold text-white flex items-center gap-2">
								<span class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">2</span>
								Buat File Sesuai Tab di Code Studio
							</h4>
							<p class="text-slate-400">Salin isi file <code>Code.gs</code>, <code>Setup.gs</code>, dan buat file HTML baru bernama <code>index.html</code>.</p>
						</div>

						<div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
							<h4 class="font-bold text-white flex items-center gap-2">
								<span class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">3</span>
								Jalankan initialSetup()
							</h4>
							<p class="text-slate-400">Pilih fungsi <code>initialSetup</code> di dropdown editor dan klik tombol <strong>Run</strong> untuk menginisialisasi spreadsheet.</p>
						</div>

						<div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
							<h4 class="font-bold text-white flex items-center gap-2">
								<span class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">4</span>
								Deploy Sebagai Web App
							</h4>
							<p class="text-slate-400">Klik <strong>Deploy $\rightarrow$ New Deployment</strong>, pilih tipe <strong>Web App</strong>, set <em>Who has access</em> ke <strong>Anyone</strong>, lalu salin URL Web App yang dihasilkan.</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
