<script lang="ts">
	import { 
		ArrowLeft, 
		Workflow, 
		FileText, 
		Sparkles, 
		Download, 
		Plus, 
		Layers, 
		Database, 
		Cpu, 
		CheckCircle2, 
		Copy, 
		Check,
		Eye,
		Share2,
		Code2,
		RefreshCw,
		Send,
		Bot,
		User,
		CornerDownLeft,
		Lightbulb,
		ChevronRight,
		ArrowRight,
		ZoomIn,
		ZoomOut,
		Maximize2,
		RotateCcw
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface ChatMsg {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: string;
		suggestedReplies?: string[];
	}

	let activeView = $state<'flow' | 'prd' | 'split'>('split');
	let flowSubTab = $state<'preview' | 'code'>('preview');
	let autoFixedNotice = $state(false);
	let copied = $state(false);
	let isSending = $state(false);
	let inputMessage = $state('');

	// Chat & Project State
	let messages = $state<ChatMsg[]>([
		{
			id: 'welcome',
			role: 'assistant',
			content: 'Halo! Saya Solution Architect & Product Lead AI. Aplikasi atau sistem apa yang ingin Anda bangun hari ini? Ceritakan ide Anda (misalnya sistem kasir POS, approval workflow kantor, pelacak inventaris dengan QR code, atau portal tiket helpdesk).',
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			suggestedReplies: [
				'Aplikasi Pelacak Inventaris & QR Code',
				'Sistem Approval Permohonan Karyawan',
				'Portal Helpdesk Tiket & SLA Support',
				'Sistem Keuangan & Pencatat Transaksi'
			]
		}
	]);

	let prdMarkdown = $state<string>(`# Product Requirements Document (PRD)

## 1. Executive Summary
Sistem manajemen operasional cerdas yang dirancang untuk mengotomatisasi pencatatan data, pelacakan proses bisnis, dan reporting analitik realtime.

## 2. User Personas
- **Staff / Operator**: Input data operasional harian & update status.
- **Supervisor**: Monitoring progres, verifikasi data, dan delegasi tugas.
- **Management**: Analisis performa melalui KPI dashboard.

## 3. Fitur Utama
1. **Pencatatan Realtime**: Validasi instan & audit log.
2. **Dashboard Visual**: Grafik tren & ringkasan metrik.
3. **Export & Notifikasi**: Ekspor format CSV/PDF & notifikasi otomatis.

## 4. Skema Database
- **Records**: ID, Timestamp, User, Category, Amount, Status, Notes
- **Users**: ID, Username, Role, Email, CreatedAt
- **Audit_Logs**: ID, Timestamp, User, Action, EntityID
`);

	let flowMermaid = $state<string>(`graph TD
    Start([🚀 User Buka Aplikasi]) --> Auth{Sudah Login?}
    Auth -- Belum --> Login[Form Login / Autentikasi]
    Login --> Dashboard
    Auth -- Sudah --> Dashboard[📊 Dashboard Utama & KPI]

    Dashboard --> ActionInput[📝 Input / Buat Data Baru]
    ActionInput --> Validate{Validasi Data}
    Validate -- Tidak Valid --> ErrorNotice[Peringatan & Koreksi]
    ErrorNotice --> ActionInput
    Validate -- Valid --> SaveDB[(💾 Simpan ke Database)]

    SaveDB --> TriggerNotify[⚡ Trigger Notifikasi Realtime]
    TriggerNotify --> ReviewStatus{Perlu Approval?}
    ReviewStatus -- Ya --> ManagerReview[Pemeriksaan Manajer]
    ReviewStatus -- Tidak --> Completed[✅ Status: Selesai]

    ManagerReview -- Disetujui --> Completed
    ManagerReview -- Ditolak --> Rejected[❌ Status: Ditolak]

    Completed --> AuditLog[(📜 Catat ke Log Audit)]
    Rejected --> AuditLog
    AuditLog --> End([🏁 Selesai])
`);

	let chatContainer: HTMLElement | null = $state(null);
	let iframeEl: HTMLIFrameElement | null = $state(null);

	const STORAGE_KEY = 'prd_flow_builder_state_v1';

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 80);
	}

	function sanitizeMermaid(raw: string): string {
		if (!raw) return '';
		let text = raw.trim();
		// Hapus code fence markdown jika ada
		text = text.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/, '').trim();

		// Pastikan diawali deklarasi tipe diagram jika belum ada
		if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)\b/i.test(text)) {
			text = 'graph TD\n' + text;
		}

		const lines = text.split('\n');
		const cleanedLines = lines.map(line => {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('%%') || /^(graph|flowchart)\b/i.test(trimmed)) {
				return line;
			}

			let l = line;

			// 1. Ganti karakter operator perbandingan < atau > di dalam tanda node agar tidak merusak parser Mermaid/XML
			// Contoh: {Stok < Minimum?} -> {Stok Kurang Dari Minimum?}
			l = l.replace(/([\{(\[\(\[]?)([\{\[\(])([^\}\]\)]*?)(<|>)([^\}\]\)]*?)([\}\]\)])([\}\)\]]?)/g, (match) => {
				return match.replace(/</g, ' Kurang Dari ').replace(/>/g, ' Lebih Dari ');
			});

			// 2. Bungkus node diamond {Teks Pertanyaan?} dengan tanda kutip dua jika belum berkutip
			l = l.replace(/\{([^{}"\n]+)\}/g, (match, inner) => {
				const t = inner.trim();
				if (t.startsWith('"') && t.endsWith('"')) return match;
				if (/[\s\?\(\)\/&+:;,\-]/.test(t)) {
					return `{"${t.replace(/"/g, "'")}"}`;
				}
				return match;
			});

			// 3. Bungkus node square [Teks (Detail)] yang memiliki tanda kurung agar tidak dianggap syntax nested node
			// Hindari menyentuh [(Database)] atau ([Pill])
			l = l.replace(/\[(?!\()([^"\]\n\[\]]*?\([^\]\n]*?\)[^"\]\n\[\]]*?)(?<!\))\]/g, (match, inner) => {
				const t = inner.trim();
				if (t.startsWith('"') && t.endsWith('"')) return match;
				return `["${t.replace(/"/g, "'")}"]`;
			});

			return l;
		});

		return cleanedLines.join('\n');
	}

	function autoFixMermaid() {
		flowMermaid = sanitizeMermaid(flowMermaid);
		autoFixedNotice = true;
		setTimeout(() => autoFixedNotice = false, 3000);
		renderMermaid();
		saveState();
	}

	function sendIframeAction(type: 'ZOOM_IN' | 'ZOOM_OUT' | 'RESET_ZOOM' | 'FIT_VIEW') {
		if (iframeEl && iframeEl.contentWindow) {
			iframeEl.contentWindow.postMessage({ type }, '*');
		}
	}

	function renderMermaid() {
		if (!iframeEl) return;
		const cleanCode = sanitizeMermaid(flowMermaid);
		const sTag = '<' + 'script';
		const cTag = '<' + '/script>';
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${sTag} src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js">${cTag}
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #080d1a;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      user-select: none;
    }
    #viewport-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      cursor: grab;
    }
    #viewport-container.dragging {
      cursor: grabbing;
    }
    #panzoom-layer {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      transition: transform 0.05s ease-out;
      will-change: transform;
    }
    #mermaid-target {
      padding: 60px;
      display: inline-block;
    }
    #mermaid-target svg {
      max-width: none !important;
      height: auto !important;
      display: block;
    }
    /* Floating HUD controls */
    .hud-controls {
      position: fixed;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(51, 65, 85, 0.8);
      backdrop-filter: blur(10px);
      padding: 4px 8px;
      border-radius: 12px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.5);
      z-index: 100;
    }
    .hud-btn {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(71, 85, 105, 0.6);
      color: #94a3b8;
      border-radius: 8px;
      height: 28px;
      padding: 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .hud-btn:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
    }
    .hud-label {
      color: #38bdf8;
      font-size: 11px;
      font-family: monospace;
      font-weight: 700;
      min-width: 44px;
      text-align: center;
      padding: 0 4px;
    }
    .hud-hint {
      position: fixed;
      bottom: 16px;
      left: 16px;
      color: #64748b;
      font-size: 11px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(51, 65, 85, 0.5);
      padding: 4px 10px;
      border-radius: 8px;
      backdrop-filter: blur(6px);
      pointer-events: none;
      z-index: 100;
    }
    .mermaid-error-box {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      color: #fca5a5;
      margin: 40px auto;
      text-align: left;
    }
    .mermaid-btn-fix {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 14px;
      transition: background 0.15s;
    }
    .mermaid-btn-fix:hover {
      background: #0369a1;
    }
  </style>
</head>
<body>
  <div id="viewport-container">
    <div id="panzoom-layer">
      <div id="mermaid-target">
        <div style="color: #64748b; font-size: 13px;">Merender diagram...</div>
      </div>
    </div>
  </div>

  <div class="hud-hint">
    <span>💡 Scroll untuk Zoom • Klik & geser untuk Pan</span>
  </div>

  <div class="hud-controls">
    <button class="hud-btn" onclick="zoomIn()" title="Perbesar (+)">+</button>
    <button class="hud-btn" onclick="zoomOut()" title="Perkecil (−)">−</button>
    <span class="hud-label" id="zoom-level">100%</span>
    <button class="hud-btn" onclick="resetZoom()" title="Reset Skala 100%">1:1</button>
    <button class="hud-btn" onclick="fitView()" title="Sesuaikan dengan Layar">Fit</button>
  </div>

  ${sTag}>
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#080d1a',
        primaryColor: '#0f766e',
        primaryTextColor: '#f0fdfa',
        primaryBorderColor: '#14b8a6',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a'
      }
    });

    let scale = 1;
    let panX = 40;
    let panY = 40;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const container = document.getElementById('viewport-container');
    const layer = document.getElementById('panzoom-layer');
    const zoomLabel = document.getElementById('zoom-level');

    function applyTransform() {
      layer.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
      if (zoomLabel) {
        zoomLabel.textContent = Math.round(scale * 100) + '%';
      }
    }

    function zoomIn() {
      zoomAt(container.clientWidth / 2, container.clientHeight / 2, 1.25);
    }

    function zoomOut() {
      zoomAt(container.clientWidth / 2, container.clientHeight / 2, 0.8);
    }

    function resetZoom() {
      scale = 1;
      panX = 60;
      panY = 60;
      applyTransform();
    }

    function fitView() {
      const target = document.getElementById('mermaid-target');
      const svg = target.querySelector('svg');
      if (!svg) return;
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      const bBox = svg.getBBox ? svg.getBBox() : { width: svg.clientWidth || 1200, height: svg.clientHeight || 800 };
      const svgW = (bBox.width || 1200) + 120;
      const svgH = (bBox.height || 800) + 120;
      
      const sX = (cW - 40) / svgW;
      const sY = (cH - 40) / svgH;
      // Jangan biarkan scale awal terlalu kecil (minimum 0.75 agar teks tetap terbaca)
      scale = Math.min(Math.max(Math.min(sX, sY), 0.7), 2.0);
      
      panX = Math.max(30, (cW - svgW * scale) / 2);
      panY = Math.max(30, (cH - svgH * scale) / 2);
      applyTransform();
    }

    function zoomAt(clientX, clientY, factor) {
      const newScale = Math.min(Math.max(0.2, scale * factor), 7);
      const ratio = newScale / scale;
      panX = clientX - (clientX - panX) * ratio;
      panY = clientY - (clientY - panY) * ratio;
      scale = newScale;
      applyTransform();
    }

    // Mouse wheel zoom at pointer
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    // Drag / Pan
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-controls') || e.target.closest('button')) return;
      isDragging = true;
      container.classList.add('dragging');
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('dragging');
      }
    });

    // Touch events for mobile/tablet
    let initialTouchDist = 0;
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        applyTransform();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialTouchDist > 0) {
          const factor = dist / initialTouchDist;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          zoomAt(midX, midY, factor > 1 ? 1.05 : 0.95);
          initialTouchDist = dist;
        }
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      isDragging = false;
      initialTouchDist = 0;
    });

    // Listen to parent Svelte messages
    window.addEventListener('message', (e) => {
      if (!e.data) return;
      if (e.data.type === 'ZOOM_IN') zoomIn();
      if (e.data.type === 'ZOOM_OUT') zoomOut();
      if (e.data.type === 'RESET_ZOOM') resetZoom();
      if (e.data.type === 'FIT_VIEW') fitView();
    });

    async function drawDiagram() {
      const target = document.getElementById('mermaid-target');
      const diagramCode = ${JSON.stringify(cleanCode)};
      try {
        const id = 'chart-' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaid.render(id, diagramCode);
        target.innerHTML = svg;
        const svgEl = target.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = 'none';
          svgEl.style.height = 'auto';
        }
        setTimeout(fitView, 80);
      } catch (err) {
        console.warn('Mermaid rendering caught error:', err);
        target.innerHTML = \`
          <div class="mermaid-error-box">
            <div style="font-size: 15px; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 8px;">
              <span>⚠️ Sintaks Diagram Perlu Penyesuaian</span>
            </div>
            <p style="font-size: 12px; color: #cbd5e1; margin: 10px 0 0 0; line-height: 1.6;">
              Diagram mengandung karakter khusus yang memicu penyesuaian parser (misalnya simbol &lt;, &gt;, atau kurung tanpa tanda kutip).
            </p>
            <button class="mermaid-btn-fix" onclick="parent.postMessage({ type: 'AUTO_FIX_MERMAID' }, '*')">
              ✨ Perbaiki Otomatis & Render Ulang
            </button>
          </div>
        \`;
      }
    }

    drawDiagram();
  ${cTag}
</body>
</html>`;
		const blob = new Blob([htmlContent], { type: 'text/html' });
		iframeEl.src = URL.createObjectURL(blob);
	}

	function saveState() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				messages,
				prdMarkdown,
				flowMermaid
			}));
		} catch (e) {}
	}

	function loadState() {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const data = JSON.parse(raw);
				if (data.messages && data.messages.length > 0) messages = data.messages;
				if (data.prdMarkdown) prdMarkdown = data.prdMarkdown;
				if (data.flowMermaid) flowMermaid = sanitizeMermaid(data.flowMermaid);
			}
		} catch (e) {}
	}

	async function handleSendMessage(overrideText?: string) {
		const text = (overrideText || inputMessage).trim();
		if (!text || isSending) return;

		const userMsg: ChatMsg = {
			id: 'msg-' + Date.now(),
			role: 'user',
			content: text,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};

		messages = [...messages, userMsg];
		inputMessage = '';
		isSending = true;
		scrollToBottom();
		saveState();

		try {
			const res = await fetch('/api/prd-flow/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.map(m => ({ role: m.role, content: m.content }))
				})
			});

			const data = await res.json();
			if (data.error) throw new Error(data.error);

			const aiMsg: ChatMsg = {
				id: 'msg-' + (Date.now() + 1),
				role: 'assistant',
				content: data.message || 'PRD dan Flowchart telah berhasil disusun.',
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				suggestedReplies: data.suggestedReplies || []
			};

			messages = [...messages, aiMsg];

			// If AI produced flowchart and PRD, update the visual canvases!
			if (data.flowchart) {
				flowMermaid = sanitizeMermaid(data.flowchart);
				setTimeout(renderMermaid, 100);
			}
			if (data.prd) {
				prdMarkdown = data.prd;
			}

			saveState();
		} catch (err: any) {
			messages = [...messages, {
				id: 'msg-' + (Date.now() + 1),
				role: 'assistant',
				content: `⚠️ Terjadi kesalahan: ${err.message || 'Gagal menghubungi server AI'}. Pastikan koneksi atau 9router aktif.`,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			}];
		} finally {
			isSending = false;
			scrollToBottom();
		}
	}

	function handleConfirmAndGenerate() {
		handleSendMessage('[KONFIRMASI_SUSUN_PRD] Saya setuju dengan rincian ini. Tolong buatkan Dokumen PRD Lengkap dan Diagram Flowchart Sistem Mermaid.js sekarang!');
	}

	function startNewProject() {
		if (confirm('Mulai diskusi ide baru? Obrolan saat ini akan di-reset.')) {
			localStorage.removeItem(STORAGE_KEY);
			location.reload();
		}
	}

	function copyPrd() {
		navigator.clipboard.writeText(prdMarkdown);
		copied = true;
		setTimeout(() => copied = false, 2500);
	}

	function downloadPrd() {
		const blob = new Blob([prdMarkdown], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Product_Requirements_Document.md`;
		a.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		loadState();
		flowMermaid = sanitizeMermaid(flowMermaid);
		saveState();
		setTimeout(renderMermaid, 200);

		const handleMsg = (e: MessageEvent) => {
			if (e.data && e.data.type === 'AUTO_FIX_MERMAID') {
				autoFixMermaid();
			}
		};
		window.addEventListener('message', handleMsg);
		return () => {
			window.removeEventListener('message', handleMsg);
		};
	});
</script>

<svelte:head>
	<title>PRD & Flow Builder • AI Architecture Studio</title>
</svelte:head>

<div class="min-h-screen h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans overflow-hidden select-none">
	<!-- Top Bar -->
	<header class="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shrink-0">
		<div class="flex items-center space-x-3 sm:space-x-4">
			<a 
				href="/"
				title="Kembali ke App Launcher Hub"
				class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 group">
				<ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
				<span class="hidden sm:inline">Apps Hub</span>
			</a>

			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-500/20">
					<Workflow class="w-5 h-5" />
				</div>
				<div>
					<div class="flex items-center space-x-2">
						<h1 class="text-sm font-bold text-white tracking-tight">PRD & Flow Builder</h1>
						<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">Studio</span>
					</div>
					<p class="text-[11px] text-slate-400 flex items-center gap-1.5">
						<Sparkles class="w-3 h-3 text-sky-400" /> AI Solution Architect & Visual Diagram Generator
					</p>
				</div>
			</div>
		</div>

		<!-- Center: View Switcher (for right canvas) -->
		<div class="hidden md:flex items-center space-x-2">
			<div class="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
				<button 
					onclick={() => activeView = 'split'}
					class="px-3 py-1 rounded-lg transition {activeView === 'split' ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
					Split View
				</button>
				<button 
					onclick={() => activeView = 'flow'}
					class="px-3 py-1 rounded-lg transition {activeView === 'flow' ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
					Flowchart Saja
				</button>
				<button 
					onclick={() => activeView = 'prd'}
					class="px-3 py-1 rounded-lg transition {activeView === 'prd' ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
					Dokumen PRD
				</button>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex items-center space-x-2">
			<button 
				onclick={startNewProject}
				title="Mulai ide baru"
				class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition">
				<Plus class="w-3.5 h-3.5 text-sky-400" />
				<span class="hidden sm:inline">Ide Baru</span>
			</button>

			<button 
				onclick={copyPrd}
				title="Salin Dokumen PRD"
				class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition">
				{#if copied}
					<Check class="w-4 h-4 text-emerald-400" />
				{:else}
					<Copy class="w-4 h-4" />
				{/if}
			</button>

			<button 
				onclick={downloadPrd}
				title="Unduh PRD (.md)"
				class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-sky-500/20">
				<Download class="w-3.5 h-3.5" />
				<span class="hidden sm:inline">Export .md</span>
			</button>
		</div>
	</header>

	<!-- Main Workspace Split -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left: AI Chat Studio Panel -->
		<section class="w-full lg:w-[460px] xl:w-[500px] h-[calc(100vh-4rem)] shrink-0 flex flex-col border-r border-slate-800/80 bg-slate-950/60">
			<!-- Chat Header -->
			<div class="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
				<div class="flex items-center gap-2">
					<div class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
					<span class="font-bold text-white">AI Solution Architect</span>
					<span class="text-[10px] px-2 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
						Wawancara Ide & Konfirmasi
					</span>
				</div>
			</div>

			<!-- Message List -->
			<div 
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4 space-y-4 select-text">
				{#each messages as msg}
					<div class="flex items-start gap-3 {msg.role === 'user' ? 'flex-row-reverse' : ''}">
						<!-- Avatar -->
						<div class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md {msg.role === 'user' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-sky-400 border border-slate-700'}">
							{#if msg.role === 'user'}
								<User class="w-3.5 h-3.5" />
							{:else}
								<Bot class="w-3.5 h-3.5" />
							{/if}
						</div>

						<!-- Message Bubble -->
						<div class="max-w-[85%] space-y-1.5">
							<div class="p-3.5 rounded-2xl text-xs leading-relaxed {msg.role === 'user' ? 'bg-sky-500/20 text-sky-100 border border-sky-500/30 rounded-tr-sm' : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-sm shadow-sm'}">
								<div class="whitespace-pre-wrap">{msg.content}</div>
							</div>

							<!-- Suggested Reply Pills -->
							{#if msg.suggestedReplies && msg.suggestedReplies.length > 0 && !isSending}
								<div class="flex flex-wrap gap-1.5 pt-1">
									{#each msg.suggestedReplies as reply}
										<button 
											onclick={() => handleSendMessage(reply)}
											class="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-sky-300 border border-slate-800 text-[11px] transition flex items-center gap-1 shadow-sm">
											<Sparkles class="w-2.5 h-2.5 text-sky-400" />
											<span>{reply}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}

				{#if isSending}
					<div class="flex items-center gap-3 animate-pulse">
						<div class="w-7 h-7 rounded-xl bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center text-xs">
							<Bot class="w-3.5 h-3.5 animate-spin" />
						</div>
						<div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-sky-300 flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
							<span>Menganalisis ide arsitektur & alur sistem...</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Quick Confirmation Bar -->
			{#if messages.length >= 2}
				<div class="px-4 py-2 bg-slate-900/70 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
					<div class="text-[11px] text-slate-400 flex items-center gap-1.5">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
						<span>Diskusi sudah cukup jelas?</span>
					</div>
					<button 
						onclick={handleConfirmAndGenerate}
						disabled={isSending}
						class="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20 disabled:opacity-50">
						<Sparkles class="w-3 h-3" />
						<span>✅ Susun PRD & Flowchart</span>
					</button>
				</div>
			{/if}

			<!-- Chat Input Bar -->
			<div class="p-3 border-t border-slate-800 bg-slate-950 shrink-0">
				<form 
					onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
					class="relative flex items-center">
					<input 
						bind:value={inputMessage}
						disabled={isSending}
						type="text"
						placeholder="Ketik ide aplikasi atau jawab pertanyaan AI..."
						class="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-3.5 pr-12 py-3 border border-slate-800 focus:border-sky-500/70 focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition"
					/>
					<button 
						type="submit"
						disabled={isSending || !inputMessage.trim()}
						class="absolute right-1.5 p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition disabled:opacity-40 disabled:cursor-not-allowed">
						<Send class="w-3.5 h-3.5" />
					</button>
				</form>
				<p class="text-[10px] text-slate-500 text-center mt-1.5 select-none">
					Ketik ide Anda secara bebas, lalu konfirmasi saat alur sudah disepakati.
				</p>
			</div>
		</section>

		<!-- Right: Visual Diagram & PRD Spec Area -->
		<section class="flex-1 flex flex-col overflow-hidden bg-[#050811]">
			{#if activeView === 'flow' || activeView === 'split'}
				<!-- Flowchart Visualizer Box -->
				<div class="flex-1 flex flex-col border-b border-slate-800/80 overflow-hidden min-h-0 bg-[#060a14]">
					<div class="p-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs shrink-0">
						<div class="flex items-center gap-2">
							<Workflow class="w-4 h-4 text-sky-400" />
							<span class="font-bold text-white">Visual User & System Flowchart</span>
							<span class="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">Interactive Mermaid</span>
						</div>

						<!-- Sub-tabs: Pratinjau vs Kode + Zoom Toolbar + Auto-Fix -->
						<div class="flex items-center gap-2">
							{#if autoFixedNotice}
								<span class="text-[11px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
									<Check class="w-3 h-3" /> Berhasil Diperbaiki
								</span>
							{/if}

							<!-- Zoom & Pan Quick Controls (When in preview mode) -->
							{#if flowSubTab === 'preview'}
								<div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
									<button 
										onclick={() => sendIframeAction('ZOOM_IN')}
										title="Perbesar Diagram (Zoom In)"
										class="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
										<ZoomIn class="w-3.5 h-3.5" />
									</button>
									<button 
										onclick={() => sendIframeAction('ZOOM_OUT')}
										title="Perkecil Diagram (Zoom Out)"
										class="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
										<ZoomOut class="w-3.5 h-3.5" />
									</button>
									<button 
										onclick={() => sendIframeAction('RESET_ZOOM')}
										title="Reset Skala 100%"
										class="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
										100%
									</button>
									<button 
										onclick={() => sendIframeAction('FIT_VIEW')}
										title="Sesuaikan dengan Layar (Fit View)"
										class="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
										<Maximize2 class="w-3.5 h-3.5" />
									</button>
								</div>
							{/if}

							<button 
								onclick={autoFixMermaid}
								title="Perbaiki karakter khusus atau format diagram secara otomatis"
								class="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1 transition">
								<Sparkles class="w-3 h-3" />
								<span>Auto-Fix</span>
							</button>

							<div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px] font-medium">
								<button 
									onclick={() => flowSubTab = 'preview'}
									class="px-2 py-0.5 rounded transition {flowSubTab === 'preview' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}">
									<Eye class="w-3 h-3 inline mr-1" /> Pratinjau
								</button>
								<button 
									onclick={() => flowSubTab = 'code'}
									class="px-2 py-0.5 rounded transition {flowSubTab === 'code' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}">
									<Code2 class="w-3 h-3 inline mr-1" /> Kode
								</button>
							</div>

							<button 
								onclick={renderMermaid}
								title="Render ulang diagram"
								class="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition p-1 hover:bg-slate-800 rounded-lg">
								<RefreshCw class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>

					{#if flowSubTab === 'preview'}
						<div class="flex-1 overflow-hidden relative">
							<iframe 
								bind:this={iframeEl}
								title="Mermaid Flowchart View"
								class="w-full h-full border-0 bg-transparent"
								sandbox="allow-scripts"
							></iframe>
						</div>
					{:else}
						<!-- Direct Mermaid Code Editor -->
						<div class="flex-1 flex flex-col p-4 bg-[#050811] overflow-hidden">
							<div class="flex items-center justify-between mb-2">
								<span class="text-[11px] text-slate-400 font-mono">Edit kode sintaks Mermaid di bawah ini:</span>
								<button 
									onclick={() => {
										renderMermaid();
										saveState();
										flowSubTab = 'preview';
									}}
									class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
									<Check class="w-3.5 h-3.5" /> Simpan & Lihat Pratinjau
								</button>
							</div>
							<textarea 
								bind:value={flowMermaid}
								spellcheck="false"
								class="flex-1 w-full p-4 bg-slate-950/90 text-sky-200 font-mono text-xs leading-relaxed focus:outline-none resize-none border border-slate-800 rounded-xl focus:border-sky-500/50 transition selection:bg-sky-500/30"
							></textarea>
						</div>
					{/if}
				</div>
			{/if}

			{#if activeView === 'prd' || activeView === 'split'}
				<!-- PRD Document View Box -->
				<div class="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#070b14]">
					<div class="p-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs shrink-0">
						<div class="flex items-center gap-2">
							<FileText class="w-4 h-4 text-emerald-400" />
							<span class="font-bold text-white">Product Requirements Document (PRD)</span>
							<span class="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">Markdown Editor</span>
						</div>

						<div class="flex items-center gap-2">
							<button 
								onclick={copyPrd}
								class="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition">
								<Copy class="w-3 h-3" />
								<span>Salin</span>
							</button>
						</div>
					</div>

					<div class="flex-1 p-4 overflow-auto select-text font-mono text-xs leading-relaxed text-slate-200">
						<textarea 
							bind:value={prdMarkdown}
							spellcheck="false"
							class="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none border border-slate-800/80 rounded-xl focus:border-sky-500/50 transition selection:bg-sky-500/30"
						></textarea>
					</div>
				</div>
			{/if}
		</section>
	</div>
</div>
