<script lang="ts">
	import { 
		Sparkles, 
		Check, 
		Plus, 
		Trash2, 
		Layers, 
		Sliders, 
		ArrowRight, 
		CheckCircle2, 
		MapPin, 
		Camera, 
		QrCode, 
		Users, 
		Clock, 
		FileText, 
		Calendar, 
		FileSpreadsheet, 
		Bell, 
		Package, 
		ArrowLeftRight, 
		AlertTriangle, 
		CheckSquare, 
		Ticket, 
		AlertCircle, 
		UserCheck, 
		GitCommit, 
		Star, 
		LineChart, 
		DollarSign, 
		PieChart, 
		ShieldCheck, 
		TrendingUp, 
		Table, 
		BarChart, 
		Shield 
	} from '@lucide/svelte';
	import type { FeatureItem } from '$lib/types';

	let {
		features = [],
		customFeatures = [],
		onApply = (selected: FeatureItem[], custom: string[]) => {},
		isApplied = false
	} = $props<{
		features: FeatureItem[];
		customFeatures?: string[];
		onApply: (selectedFeatures: FeatureItem[], customFeatures: string[]) => void;
		isApplied?: boolean;
	}>();

	let localFeatures = $state<FeatureItem[]>([]);
	let localCustom = $state<string[]>([]);
	let newCustomInput = $state('');
	let appliedSuccess = $state(false);

	$effect(() => {
		if (features && features.length > 0) {
			localFeatures = features.map((f: FeatureItem) => ({ ...f }));
		}
		if (customFeatures) {
			localCustom = [...customFeatures];
		}
	});

	// Group features by category
	const groupedFeatures = $derived.by(() => {
		const groups: Record<string, FeatureItem[]> = {};
		for (const item of localFeatures) {
			const cat = item.category || 'Fitur Lainnya';
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(item);
		}
		return groups;
	});

	const selectedCount = $derived(localFeatures.filter(f => f.selected).length + localCustom.length);

	function toggleFeature(id: string) {
		localFeatures = localFeatures.map(f => f.id === id ? { ...f, selected: !f.selected } : f);
	}

	function addCustomFeature() {
		const val = newCustomInput.trim();
		if (!val) return;
		if (!localCustom.includes(val)) {
			localCustom = [...localCustom, val];
		}
		newCustomInput = '';
	}

	function removeCustomFeature(idx: number) {
		localCustom = localCustom.filter((_, i) => i !== idx);
	}

	function handleApply() {
		const selected = localFeatures.filter(f => f.selected);
		onApply(selected, localCustom);
		appliedSuccess = true;
		setTimeout(() => (appliedSuccess = false), 2500);
	}

	// Helper to get icon component
	function getIconComponent(iconName?: string) {
		switch (iconName) {
			case 'map-pin': return MapPin;
			case 'camera': return Camera;
			case 'qr-code': return QrCode;
			case 'users': return Users;
			case 'clock': return Clock;
			case 'file-text': return FileText;
			case 'calendar': return Calendar;
			case 'file-spreadsheet': return FileSpreadsheet;
			case 'bell': return Bell;
			case 'package': return Package;
			case 'arrow-left-right': return ArrowLeftRight;
			case 'alert-triangle': return AlertTriangle;
			case 'check-square': return CheckSquare;
			case 'ticket': return Ticket;
			case 'alert-circle': return AlertCircle;
			case 'user-check': return UserCheck;
			case 'git-commit': return GitCommit;
			case 'star': return Star;
			case 'line-chart': return LineChart;
			case 'dollar-sign': return DollarSign;
			case 'pie-chart': return PieChart;
			case 'shield-check': return ShieldCheck;
			case 'trending-up': return TrendingUp;
			case 'table': return Table;
			case 'bar-chart': return BarChart;
			default: return Shield;
		}
	}
</script>

<div class="rounded-2xl bg-slate-900/90 border border-slate-700/80 p-4 sm:p-5 space-y-4 shadow-xl text-slate-100 max-w-full">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center space-x-2.5">
			<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
				<Sliders class="w-4 h-4" />
			</div>
			<div>
				<h4 class="text-xs font-bold text-white flex items-center gap-1.5">
					<span>Rekomendasi Modul & Fitur</span>
					<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
						{selectedCount} Terpilih
					</span>
				</h4>
				<p class="text-[11px] text-slate-400">Centang fitur yang Anda butuhkan untuk disusun otomatis ke PRD</p>
			</div>
		</div>
	</div>

	<!-- Categories & Features List -->
	<div class="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
		{#each Object.entries(groupedFeatures) as [categoryName, items]}
			<div class="space-y-2">
				<p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
					<span>{categoryName}</span>
				</p>
				<div class="space-y-1.5">
					{#each items as item}
						{@const IconCmp = getIconComponent(item.icon)}
						<button
							type="button"
							onclick={() => toggleFeature(item.id)}
							class="w-full p-2.5 rounded-xl border text-left flex items-start space-x-3 transition {item.selected ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'}">
							<div class="mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition {item.selected ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm' : 'border-slate-700 bg-slate-900'}">
								{#if item.selected}
									<Check class="w-3 h-3 stroke-[3]" />
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center space-x-1.5">
									<IconCmp class="w-3.5 h-3.5 {item.selected ? 'text-emerald-400' : 'text-slate-500'} shrink-0" />
									<span class="text-xs font-semibold {item.selected ? 'text-white' : 'text-slate-300'} truncate">{item.title}</span>
								</div>
								{#if item.description}
									<p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.description}</p>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Custom Features Section -->
		<div class="space-y-2 pt-2 border-t border-slate-800">
			<p class="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
				<Sparkles class="w-3.5 h-3.5" />
				<span>Fitur Tambahan Kustom Anda</span>
			</p>
			
			{#if localCustom.length > 0}
				<div class="space-y-1.5">
					{#each localCustom as customItem, idx}
						<div class="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
							<div class="flex items-center space-x-2">
								<CheckCircle2 class="w-3.5 h-3.5 text-amber-400 shrink-0" />
								<span class="font-medium">{customItem}</span>
							</div>
							<button 
								type="button" 
								onclick={() => removeCustomFeature(idx)}
								class="p-1 text-slate-400 hover:text-rose-400 transition">
								<Trash2 class="w-3 h-3" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add Custom Feature Input -->
			<div class="flex items-center space-x-2 pt-1">
				<input 
					type="text" 
					bind:value={newCustomInput}
					placeholder="Ketik fitur kustom (misal: Notifikasi Telegram HRD)..."
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature(); } }}
					class="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
				/>
				<button 
					type="button" 
					onclick={addCustomFeature}
					class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 transition">
					<Plus class="w-3.5 h-3.5" />
					<span>Tambah</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Action Button -->
	<div class="pt-2 border-t border-slate-800">
		<button 
			type="button" 
			onclick={handleApply}
			class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition transform active:scale-98 flex items-center justify-center gap-2">
			{#if appliedSuccess}
				<Check class="w-4 h-4 stroke-[3]" />
				<span>✓ Berhasil Diterapkan ke PRD!</span>
			{:else}
				<Sparkles class="w-4 h-4 text-slate-950" />
				<span>Terapkan {selectedCount} Fitur Terpilih ke PRD</span>
				<ArrowRight class="w-3.5 h-3.5" />
			{/if}
		</button>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 5px; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.4); border-radius: 9999px; }
</style>
