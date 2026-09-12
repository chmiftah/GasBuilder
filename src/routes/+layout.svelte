<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
	{@render children()}
</div>
