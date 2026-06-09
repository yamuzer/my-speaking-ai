<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="app-layout">
	{@render children()}
	<footer class="fixed bottom-0 right-0 m-3 rounded-tl-2xl rounded-bl-2xl bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-lg backdrop-blur-sm">
		버전 {data.appVersion}
	</footer>
</div>
