<script lang="ts">
	import { X, Key, Shield, Bot, Save, Check, Globe, Sparkles, Cpu } from '@lucide/svelte';

	let {
		isOpen = false,
		apiKey = '',
		baseUrl = 'https://api.deepseek.com',
		model = 'deepseek-chat',
		onSave = (key: string, mdl: string, url: string) => {},
		onClose = () => {}
	} = $props<{
		isOpen: boolean;
		apiKey: string;
		baseUrl: string;
		model: string;
		onSave: (key: string, model: string, baseUrl: string) => void;
		onClose: () => void;
	}>();

	let currentProvider = $state('deepseek');
	let currentKey = $state('');
	let currentBaseUrl = $state('https://api.deepseek.com');
	let currentModel = $state('deepseek-chat');
	let customModelInput = $state('');
	let saved = $state(false);

	const PROVIDER_PRESETS: Record<string, { name: string; baseUrl: string; defaultModel: string; models: { id: string; label: string }[]; placeholder: string }> = {
		'9router': {
			name: '9router AI Gateway',
			baseUrl: 'http://localhost:20128/v1',
			defaultModel: 'deepseek/deepseek-chat',
			models: [
				{ id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Chat / Fast)' },
				{ id: 'deepseek-chat', label: 'DeepSeek Chat (Direct ID)' },
				{ id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (Deep Reasoning)' },
				{ id: 'openai/gpt-4o', label: 'GPT-4o (OpenAI Flagship)' },
				{ id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
				{ id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
				{ id: 'custom', label: 'Ketik Model Custom Lainnya...' }
			],
			placeholder: 'sk-...'
		},
		'deepseek': {
			name: 'DeepSeek Official API',
			baseUrl: 'https://api.deepseek.com',
			defaultModel: 'deepseek-chat',
			models: [
				{ id: 'deepseek-chat', label: 'DeepSeek-V3 (Cepat & Akurat - Rekomendasi)' },
				{ id: 'deepseek-reasoner', label: 'DeepSeek-R1 (Deep Reasoning & Complex Architecture)' }
			],
			placeholder: 'sk-...'
		},
		'openrouter': {
			name: 'OpenRouter.ai',
			baseUrl: 'https://openrouter.ai/api/v1',
			defaultModel: 'deepseek/deepseek-chat',
			models: [
				{ id: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
				{ id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
				{ id: 'google/gemini-2.0-flash-001', label: 'Google Gemini 2.0 Flash' },
				{ id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
				{ id: 'custom', label: 'Ketik Model Custom Lainnya...' }
			],
			placeholder: 'sk-or-v1-...'
		},
		'custom': {
			name: 'Custom / Local LLM (Ollama, OneAPI, dll)',
			baseUrl: 'http://localhost:11434/v1',
			defaultModel: 'qwen2.5-coder',
			models: [
				{ id: 'custom', label: 'Ketik Nama Model Bebas...' }
			],
			placeholder: 'Bearer token / API key'
		}
	};

	let lastIsOpen = $state(false);

	$effect(() => {
		if (isOpen && !lastIsOpen) {
			currentKey = apiKey;
			currentBaseUrl = baseUrl || 'https://api.deepseek.com';
			currentModel = model || 'deepseek-chat';

			// Detect active provider from currentBaseUrl
			if (currentBaseUrl.includes('9router')) {
				currentProvider = '9router';
			} else if (currentBaseUrl.includes('openrouter')) {
				currentProvider = 'openrouter';
			} else if (currentBaseUrl.includes('deepseek')) {
				currentProvider = 'deepseek';
			} else {
				currentProvider = 'custom';
			}
		}
		lastIsOpen = isOpen;
	});

	function handleProviderChange(providerKey: string) {
		currentProvider = providerKey;
		const preset = PROVIDER_PRESETS[providerKey];
		if (preset) {
			currentBaseUrl = preset.baseUrl;
			currentModel = preset.defaultModel;
		}
	}

	function handleSave() {
		const finalModel = currentModel === 'custom' && customModelInput.trim() ? customModelInput.trim() : currentModel;
		onSave(currentKey.trim(), finalModel, currentBaseUrl.trim());
		saved = true;
		setTimeout(() => {
			saved = false;
			onClose();
		}, 1000);
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
		<div class="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<div class="flex items-center space-x-2.5">
					<div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
						<Cpu class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-xs font-bold text-white">Konfigurasi AI Provider & 9router</h3>
						<p class="text-[11px] text-slate-400">Hubungkan 9router, DeepSeek, OpenRouter, atau endpoint kustom</p>
					</div>
				</div>
				<button 
					onclick={onClose}
					class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
				<!-- Provider Preset Selector -->
				<div>
					<label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
						<Globe class="w-3.5 h-3.5 text-emerald-400" />
						<span>Pilih AI Gateway / Provider</span>
					</label>
					<div class="grid grid-cols-2 gap-2">
						{#each Object.entries(PROVIDER_PRESETS) as [pKey, pVal]}
							<button 
								type="button"
								onclick={() => handleProviderChange(pKey)}
								class="p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center gap-2 {currentProvider === pKey ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}">
								<span class="w-2 h-2 rounded-full {currentProvider === pKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
								<span class="truncate">{pVal.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Base URL Input -->
				<div>
					<label for="base-url-input" class="block text-xs font-semibold text-slate-300 mb-1">
						API Base URL
					</label>
					<div class="relative">
						<input 
							id="base-url-input"
							type="text" 
							bind:value={currentBaseUrl}
							placeholder="https://api.9router.com/v1" 
							class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
						/>
					</div>
					<p class="text-[10px] text-slate-400 mt-1">
						Endpoint OpenAI-compatible. Otomatis memanggil <code>/chat/completions</code>.
					</p>
				</div>

				<!-- API Key Input -->
				<div>
					<label for="api-key-input" class="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
						<span>API Key / Token Otorisasi</span>
						{#if currentProvider === '9router'}
							<span class="text-[10px] text-emerald-400 font-normal">Dari dashboard 9router</span>
						{/if}
					</label>
					<div class="relative">
						<input 
							id="api-key-input"
							type="password" 
							bind:value={currentKey}
							placeholder={PROVIDER_PRESETS[currentProvider]?.placeholder || 'sk-...'} 
							class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
						/>
					</div>
				</div>

				<!-- Model Selection -->
				<div>
					<label for="model-select" class="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
						<Sparkles class="w-3.5 h-3.5 text-amber-400" />
						<span>Pilih Model AI</span>
					</label>
					<select 
						id="model-select"
						bind:value={currentModel}
						class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500">
						{#if PROVIDER_PRESETS[currentProvider]}
							{#each PROVIDER_PRESETS[currentProvider].models as mdl}
								<option value={mdl.id}>{mdl.label}</option>
							{/each}
						{/if}
						<option value="custom">Model Kustom Lainnya...</option>
					</select>

					{#if currentModel === 'custom'}
						<div class="mt-2">
							<input 
								type="text" 
								bind:value={customModelInput}
								placeholder="Contoh: deepseek/deepseek-chat, gpt-4o, qwen/qwen-2.5-coder-32b-instruct" 
								class="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
							/>
						</div>
					{/if}
				</div>

				<div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
					<Shield class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
					<span>Kunci API & Base URL disimpan aman di LocalStorage browser Anda dan digunakan langsung saat memanggil AI.</span>
				</div>

				<div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
					<button 
						type="button" 
						onclick={onClose}
						class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
						Batal
					</button>
					<button 
						type="submit" 
						class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5">
						{#if saved}
							<Check class="w-3.5 h-3.5" />
							<span>Tersimpan!</span>
						{:else}
							<Save class="w-3.5 h-3.5" />
							<span>Simpan Pengaturan</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

