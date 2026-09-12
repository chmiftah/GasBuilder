import type { FeatureItem, PRDSpec } from '$lib/types';

export interface DomainPreset {
	domain: string;
	appName: string;
	tagline: string;
	categories: {
		name: string;
		features: {
			id: string;
			title: string;
			description: string;
			selected: boolean;
			icon: string;
		}[];
	}[];
}

export const DOMAIN_PRESETS: Record<string, DomainPreset> = {
	presensi: {
		domain: 'Presensi & Absensi Karyawan',
		appName: 'Sistem Presensi & Geolocation Karyawan',
		tagline: 'Presensi Real-time dengan Verifikasi GPS, Foto Selfie, & Pengajuan Cuti',
		categories: [
			{
				name: '👤 Autentikasi & Pengguna',
				features: [
					{
						id: 'auth_role',
						title: 'Login Multi-Role (Karyawan & Admin/HRD)',
						description: 'Karyawan hanya melihat data miliknya, Admin mengelola seluruh cabang & rekap.',
						selected: true,
						icon: 'users'
					},
					{
						id: 'shift_management',
						title: 'Pengaturan Jadwal Kerja & Shift (Pagi/Siang/Malam)',
						description: 'Toleransi keterlambatan dan batasan jam check-in check-out.',
						selected: true,
						icon: 'clock'
					}
				]
			},
			{
				name: '📍 Validasi & Keamanan Presensi',
				features: [
					{
						id: 'gps_geofencing',
						title: 'Validasi Lokasi GPS (Geofencing Radius Kantor)',
						description: 'Mengunci presensi hanya bisa dilakukan dalam radius meter dari titik koordinat kantor.',
						selected: true,
						icon: 'map-pin'
					},
					{
						id: 'selfie_camera',
						title: 'Kamera Selfie / Bukti Foto Wajah',
						description: 'Mengambil snapshot kamera saat check-in untuk mencegah titip absen.',
						selected: true,
						icon: 'camera'
					},
					{
						id: 'qr_scanner',
						title: 'Scan Dynamic QR Code Kantor',
						description: 'Scan QR di layar display kantor untuk verifikasi kehadiran di tempat.',
						selected: false,
						icon: 'qr-code'
					}
				]
			},
			{
				name: '📝 Izin, Sakit & Cuti (Workflow)',
				features: [
					{
						id: 'leave_request',
						title: 'Formulir Pengajuan Izin / Sakit / Cuti',
						description: 'Upload surat dokter/keterangan dengan status approval berjenjang.',
						selected: true,
						icon: 'file-text'
					},
					{
						id: 'overtime_request',
						title: 'Pengajuan & Pencatatan Lembur (Overtime)',
						description: 'Kalkulasi jam lembur dan persetujuan supervisor.',
						selected: false,
						icon: 'calendar'
					}
				]
			},
			{
				name: '📊 Dashboard, Laporan & Notifikasi',
				features: [
					{
						id: 'attendance_summary',
						title: 'Rekap Bulanan & Ekspor Excel / CSV',
						description: 'Download laporan presensi per departemen/karyawan siap payroll.',
						selected: true,
						icon: 'file-spreadsheet'
					},
					{
						id: 'auto_notification',
						title: 'Notifikasi Otomatis Email / WhatsApp Presensi',
						description: 'Kirim reminder presensi atau konfirmasi pengajuan izin otomatis.',
						selected: false,
						icon: 'bell'
					}
				]
			}
		]
	},
	inventaris: {
		domain: 'Inventaris & Manajemen Aset',
		appName: 'Sistem Manajemen Aset & Inventaris Gudang',
		tagline: 'Tracking Stok Real-time, Scanner Barcode, & Riwayat Mutasi Barang',
		categories: [
			{
				name: '📦 Master Data & Katalog Barang',
				features: [
					{
						id: 'item_catalog',
						title: 'Katalog Master Barang & Kategori Multi-Level',
						description: 'Kode SKU, nama barang, satuan, stok minimum, & harga perolehan.',
						selected: true,
						icon: 'package'
					},
					{
						id: 'location_tracking',
						title: 'Manajemen Lokasi Rak / Gudang / Cabang',
						description: 'Penempatan barang berdasarkan nomor rak dan zona gudang.',
						selected: true,
						icon: 'map-pin'
					}
				]
			},
			{
				name: '🔄 Transaksi & Mutasi Stok',
				features: [
					{
						id: 'stock_in_out',
						title: 'Pencatatan Stok Masuk (In) & Stok Keluar (Out)',
						description: 'Update kuantitas stok otomatis dan log pemohon/pemasok.',
						selected: true,
						icon: 'arrow-left-right'
					},
					{
						id: 'barcode_scanner',
						title: 'Scanner Barcode / QR Code Barang',
						description: 'Scan cepat menggunakan kamera HP/Laptop untuk cari atau mutasi barang.',
						selected: true,
						icon: 'qr-code'
					},
					{
						id: 'stock_opname',
						title: 'Modul Stock Opname & Penyesuaian Selisih',
						description: 'Pemeriksaan fisik berkala dengan berita acara penyesuaian.',
						selected: false,
						icon: 'check-square'
					}
				]
			},
			{
				name: '⚠️ Peringatan & Laporan',
				features: [
					{
						id: 'low_stock_alert',
						title: 'Peringatan Otomatis Stok Menipis (Low Stock Alert)',
						description: 'Highlight kartu peringatan ketika stok di bawah batas minimum.',
						selected: true,
						icon: 'alert-triangle'
					},
					{
						id: 'inventory_report',
						title: 'Laporan Nilai Aset & Ekspor CSV',
						description: 'Grafik tren pemakaian barang dan valuasi total nilai inventaris.',
						selected: true,
						icon: 'file-spreadsheet'
					}
				]
			}
		]
	},
	helpdesk: {
		domain: 'Helpdesk & Tiket Pengaduan',
		appName: 'Enterprise Helpdesk & Ticketing Support',
		tagline: 'Manajemen Tiket Layanan, SLA Tracker, & Penugasan Teknisi Cepat',
		categories: [
			{
				name: '🎫 Layanan & Pengajuan Tiket',
				features: [
					{
						id: 'ticket_submission',
						title: 'Formulir Tiket Pengaduan / Request Layanan',
						description: 'Nomor tiket otomatis (contoh: TIK-2609-001), kategori, dan lampiran foto/file.',
						selected: true,
						icon: 'ticket'
					},
					{
						id: 'ticket_priority',
						title: 'Level Prioritas & SLA Tracker (Urgent, High, Medium, Low)',
						description: 'Penanda warna status dan target waktu penyelesaian.',
						selected: true,
						icon: 'alert-circle'
					}
				]
			},
			{
				name: '🛠️ Workflow & Penugasan Tim',
				features: [
					{
						id: 'assignee_dispatch',
						title: 'Penugasan Teknisi / Agen Support',
						description: 'Admin dapat mendisposisikan tiket ke teknisi spesialis yang bertugas.',
						selected: true,
						icon: 'user-check'
					},
					{
						id: 'status_lifecycle',
						title: 'Status Tracker (Open -> In Progress -> Pending -> Resolved)',
						description: 'Riwayat catatan penanganan teknisi di setiap perubahan status.',
						selected: true,
						icon: 'git-commit'
					}
				]
			},
			{
				name: '📈 Analitik & Kepuasan Pengguna',
				features: [
					{
						id: 'csat_rating',
						title: 'Rating Kepuasan Pengguna (Bintang 1-5 & Feedback)',
						description: 'Pemohon dapat memberikan ulasan setelah tiket selesai.',
						selected: false,
						icon: 'star'
					},
					{
						id: 'sla_dashboard',
						title: 'Dashboard Kinerja SLA & Laporan Bulanan',
						description: 'Grafik waktu rata-rata penyelesaian tiket dan efisiensi tim teknisi.',
						selected: true,
						icon: 'line-chart'
					}
				]
			}
		]
	},
	keuangan: {
		domain: 'Pencatatan Keuangan & Kas',
		appName: 'Sistem Kas & Manajemen Keuangan Operasional',
		tagline: 'Pencatatan Arus Kas Masuk/Keluar, Bukti Kwitansi, & Rekap Laba Rugi',
		categories: [
			{
				name: '💰 Transaksi Kas & Jurnal',
				features: [
					{
						id: 'cash_in_out',
						title: 'Pencatatan Pemasukan (Debit) & Pengeluaran (Kredit)',
						description: 'Kategori transaksi, nomor bukti/struk, dan metode pembayaran.',
						selected: true,
						icon: 'dollar-sign'
					},
					{
						id: 'receipt_upload',
						title: 'Upload Bukti Transaksi / Foto Kwitansi',
						description: 'Simpan file bukti transaksi terintegrasi Google Drive.',
						selected: true,
						icon: 'camera'
					}
				]
			},
			{
				name: '📑 Anggaran & Persetujuan',
				features: [
					{
						id: 'budget_limit',
						title: 'Manajemen Pos Anggaran (Budgeting)',
						description: 'Monitoring sisa plafon anggaran per kategori belanja.',
						selected: true,
						icon: 'pie-chart'
					},
					{
						id: 'finance_approval',
						title: 'Approval Pengeluaran oleh Bendahara / Manajer',
						description: 'Status verifikasi sebelum dana dicairkan.',
						selected: false,
						icon: 'shield-check'
					}
				]
			},
			{
				name: '📊 Laporan & Neraca',
				features: [
					{
						id: 'cashflow_dashboard',
						title: 'Dashboard Saldo Real-Time & Grafik Arus Kas',
						description: 'Visualisasi pendapatan vs pengeluaran bulanan.',
						selected: true,
						icon: 'trending-up'
					},
					{
						id: 'financial_export',
						title: 'Laporan Keuangan & Ekspor Buku Kas Excel',
						description: 'Download buku kas harian/bulanan dalam format spreadsheet.',
						selected: true,
						icon: 'file-spreadsheet'
					}
				]
			}
		]
	}
};

/**
 * Generate intelligent feature checklist recommendations based on user prompt or PRD keywords
 */
export function generateFeatureRecommendations(promptText: string): FeatureItem[] {
	const text = promptText.toLowerCase();

	let matchedPreset: DomainPreset = DOMAIN_PRESETS.presensi;

	if (text.includes('presens') || text.includes('absen') || text.includes('kehadiran') || text.includes('cuti') || text.includes('karyawan') || text.includes('pegawai')) {
		matchedPreset = DOMAIN_PRESETS.presensi;
	} else if (text.includes('inven') || text.includes('aset') || text.includes('gudang') || text.includes('barang') || text.includes('stok') || text.includes('alat')) {
		matchedPreset = DOMAIN_PRESETS.inventaris;
	} else if (text.includes('tiket') || text.includes('helpdesk') || text.includes('aduan') || text.includes('layanan') || text.includes('service') || text.includes('komplain')) {
		matchedPreset = DOMAIN_PRESETS.helpdesk;
	} else if (text.includes('keuangan') || text.includes('kas') || text.includes('uang') || text.includes('anggaran') || text.includes('transaksi') || text.includes('biaya')) {
		matchedPreset = DOMAIN_PRESETS.keuangan;
	} else {
		// Generic smart recommendation generator
		return [
			{
				id: 'auth_users',
				category: '👤 Autentikasi & Akun',
				title: 'Login Pengguna & Hak Akses (Role-Based)',
				description: 'Manajemen akun Admin vs Pengguna Standar.',
				selected: true,
				icon: 'users'
			},
			{
				id: 'crud_data',
				category: '📋 Manajemen Data Utama',
				title: 'Form Input Dinamis & Validasi Data Real-Time',
				description: 'Input data dengan auto ID dan dropdown kategori.',
				selected: true,
				icon: 'file-text'
			},
			{
				id: 'table_filters',
				category: '📋 Manajemen Data Utama',
				title: 'Tabel Interaktif, Filter Status, & Pencarian Instan',
				description: 'Cari cepat, filter kategori/status, dan modal edit baris.',
				selected: true,
				icon: 'table'
			},
			{
				id: 'dashboard_kpi',
				category: '📊 Analitik & Ringkasan',
				title: 'Dashboard KPI & Grafik Statistik Visual (Chart.js)',
				description: 'Metrik total data, perbandingan kategori, dan grafik status.',
				selected: true,
				icon: 'bar-chart'
			},
			{
				id: 'export_csv',
				category: '📊 Analitik & Ringkasan',
				title: 'Ekspor Laporan ke Spreadsheet / CSV',
				description: 'Unduh seluruh data kapan saja untuk pelaporan.',
				selected: true,
				icon: 'file-spreadsheet'
			},
			{
				id: 'audit_log',
				category: '🔒 Audit & Riwayat',
				title: 'Log Aktivitas Sistem & Catatan Audit Riwayat',
				description: 'Mencatat waktu dan nama pembuat perubahan data.',
				selected: true,
				icon: 'shield'
			}
		];
	}

	const result: FeatureItem[] = [];
	for (const cat of matchedPreset.categories) {
		for (const feat of cat.features) {
			result.push({
				id: feat.id,
				category: cat.name,
				title: feat.title,
				description: feat.description,
				selected: feat.selected,
				icon: feat.icon
			});
		}
	}
	return result;
}

/**
 * Build a customized PRDSpec directly from selected features and custom features list
 */
export function buildPRDFromFeatures(
	domainName: string,
	selectedFeatures: FeatureItem[],
	customFeatures: string[] = []
): PRDSpec {
	const allText = `${domainName} ${(selectedFeatures || []).map(f => `${f.id} ${f.title} ${f.category} ${f.description}`).join(' ')} ${(customFeatures || []).join(' ')}`.toLowerCase();

	let basePreset = DOMAIN_PRESETS.keuangan;

	if (allText.includes('uang') || allText.includes('kas') || allText.includes('keuangan') || allText.includes('cash') || allText.includes('budget') || allText.includes('kwitansi') || allText.includes('debit') || allText.includes('kredit')) {
		basePreset = DOMAIN_PRESETS.keuangan;
	} else if (allText.includes('inven') || allText.includes('aset') || allText.includes('barang') || allText.includes('stok') || allText.includes('gudang') || allText.includes('sku')) {
		basePreset = DOMAIN_PRESETS.inventaris;
	} else if (allText.includes('tiket') || allText.includes('helpdesk') || allText.includes('aduan') || allText.includes('sla') || allText.includes('teknisi')) {
		basePreset = DOMAIN_PRESETS.helpdesk;
	} else if (allText.includes('presens') || allText.includes('absen') || allText.includes('kehadiran') || allText.includes('gps') || allText.includes('selfie') || allText.includes('cuti') || allText.includes('shift')) {
		basePreset = DOMAIN_PRESETS.presensi;
	} else {
		basePreset = {
			domain: domainName || 'Manajemen Operasional Enterprise',
			appName: domainName || 'Sistem Pengelolaan & Pelaporan',
			tagline: 'Platform Enterprise Web App Terintegrasi Google Sheets',
			categories: []
		};
	}

	const hasAuth = selectedFeatures.some((f) => f.id.includes('auth') || f.title.toLowerCase().includes('login') || f.title.toLowerCase().includes('user'));
	const hasLeave = selectedFeatures.some((f) => f.id.includes('leave') || f.title.toLowerCase().includes('cuti') || f.title.toLowerCase().includes('izin'));
	const hasGps = selectedFeatures.some((f) => f.id.includes('gps') || f.title.toLowerCase().includes('gps') || f.title.toLowerCase().includes('lokasi'));
	const hasSelfie = selectedFeatures.some((f) => f.id.includes('selfie') || f.title.toLowerCase().includes('kamera') || f.title.toLowerCase().includes('foto'));
	const hasQr = selectedFeatures.some((f) => f.id.includes('qr') || f.title.toLowerCase().includes('qr'));

	// Sheets Definition
	const sheets = [
		{
			name: 'Data_Utama',
			description: 'Data rekaman utama aplikasi',
			headers: ['ID', 'Tanggal', 'Nama', 'Kategori', 'Status', 'Catatan']
		}
	];

	if (basePreset.domain.includes('Presensi')) {
		sheets[0] = {
			name: 'Presensi_Harian',
			description: 'Tabel riwayat presensi masuk dan pulang karyawan',
			headers: [
				'ID_Presensi',
				'Tanggal',
				'Username',
				'Nama_Karyawan',
				'Waktu_Masuk',
				'Waktu_Pulang',
				...(hasGps ? ['Lokasi_GPS', 'Jarak_Meter'] : []),
				...(hasSelfie ? ['Foto_Selfie_URL'] : []),
				...(hasQr ? ['QR_Code_Verified'] : []),
				'Status_Kehadiran',
				'Catatan'
			]
		};

		if (hasLeave) {
			sheets.push({
				name: 'Pengajuan_Izin_Cuti',
				description: 'Daftar permohonan izin, sakit, dan cuti karyawan',
				headers: ['ID_Izin', 'Tanggal_Pengajuan', 'Nama_Karyawan', 'Jenis_Izin', 'Tanggal_Mulai', 'Tanggal_Selesai', 'Bukti_Surat', 'Status_Approval', 'Catatan_HRD']
			});
		}
	} else if (basePreset.domain.includes('Inventaris')) {
		sheets[0] = {
			name: 'Master_Barang',
			description: 'Katalog data inventaris dan aset',
			headers: ['Kode_SKU', 'Nama_Barang', 'Kategori', 'Lokasi_Gudang', 'Stok_Tersedia', 'Stok_Minimum', 'Satuan', 'Harga_Beli', 'Status_Kondisi']
		};
		sheets.push({
			name: 'Mutasi_Stok',
			description: 'Catatan barang masuk dan keluar',
			headers: ['ID_Mutasi', 'Tanggal', 'Kode_SKU', 'Nama_Barang', 'Tipe_Mutasi', 'Jumlah', 'Nama_Petugas', 'Keterangan']
		});
	} else if (basePreset.domain.includes('Helpdesk')) {
		sheets[0] = {
			name: 'Tiket_Layanan',
			description: 'Daftar tiket pengaduan dan permintaan bantuan',
			headers: ['Nomor_Tiket', 'Tanggal_Dibuat', 'Nama_Pemohon', 'Departemen', 'Kategori_Kendala', 'Prioritas', 'Deskripsi', 'Teknisi_Bertugas', 'Status_Tiket', 'Tanggal_Selesai']
		};
	} else if (basePreset.domain.includes('Kas')) {
		sheets[0] = {
			name: 'Buku_Kas',
			description: 'Pencatatan arus kas masuk dan keluar',
			headers: ['ID_Transaksi', 'Tanggal', 'Tipe_Arus', 'Kategori', 'Jumlah_Nominal', 'Keterangan', 'Bukti_Kwitansi', 'Nama_Petugas', 'Status_Verifikasi']
		};
	}

	if (hasAuth) {
		sheets.push({
			name: 'Users',
			description: 'Tabel akun kredensial dan role pengguna',
			headers: ['User_ID', 'Username', 'Password', 'Nama_Lengkap', 'Role', 'Status_Akun']
		});
	}

	sheets.push({
		name: 'Log_Aktivitas',
		description: 'Audit log pencatatan riwayat sistem',
		headers: ['Timestamp', 'Username', 'Aksi']
	});

	// Build Views
	const views: { title: string; description: string; elements: string[] }[] = [];

	if (hasAuth) {
		views.push({
			title: 'Layar Login & Otorisasi',
			description: 'Form login aman username dan password dengan validasi role akun.',
			elements: ['Input Username', 'Input Password', 'Tombol Masuk', 'Peringatan Error']
		});
	}

	views.push({
		title: 'Dashboard & Ringkasan Metrik',
		description: 'Visualisasi metrik KPI statistik harian/bulanan dan grafik status interaktif.',
		elements: ['Kartu Metrik KPI', 'Grafik Analisis Status (Chart.js)', 'Feed Riwayat Aktivitas']
	});

	views.push({
		title: `Modul Manajemen ${sheets[0].name.replace(/_/g, ' ')}`,
		description: 'Tabel data interaktif lengkap dengan filter status, pencarian instan, dan form entri modal.',
		elements: ['Search Bar', 'Filter Dropdown', 'Tabel Data Interaktif', 'Modal Tambah / Edit', 'Export CSV']
	});

	if (hasLeave) {
		views.push({
			title: 'Modul Pengajuan & Approval Izin/Cuti',
			description: 'Formulir permohonan izin dan tabel verifikasi oleh HRD/Manajer.',
			elements: ['Formulir Izin/Cuti', 'Upload Bukti', 'Tabel Status Approval', 'Tombol Setujui/Tolak']
		});
	}

	if (customFeatures.length > 0) {
		views.push({
			title: 'Fitur Tambahan Kustom',
			description: customFeatures.join(', '),
			elements: customFeatures.map((c) => `Fitur: ${c}`)
		});
	}

	return {
		appName: basePreset.appName,
		tagline: basePreset.tagline,
		summary: `Web App Google Apps Script berbasis Google Sheets yang dirancang khusus untuk ${basePreset.domain} dengan ${selectedFeatures.length} fitur terpilih.${customFeatures.length > 0 ? ` Termasuk fitur kustom: ${customFeatures.join(', ')}.` : ''}`,
		appType: 'webapp',
		spreadsheetName: `DB - ${basePreset.appName}`,
		sheets,
		features: selectedFeatures,
		customFeatures: customFeatures,
		uiFeatures: {
			theme: 'Clean Modern Enterprise Slate with Emerald/Blue Accents',
			views
		},
		backendFunctions: [
			{ name: 'doGet', description: 'Web App router and initial HTML rendering', params: ['e'], returns: 'HtmlOutput' },
			...(hasAuth ? [{ name: 'loginUser', description: 'Validasi login pengguna', params: ['username', 'password'], returns: 'Object' }] : []),
			{ name: 'getDashboardStats', description: 'Mengambil ringkasan statistik dan grafik', params: [], returns: 'Object' },
			{ name: 'getTableData', description: 'Mengambil data tabel secara dinamis', params: ['tableName'], returns: 'Object' },
			{ name: 'createRecord', description: 'Menambah data baru ke tabel', params: ['tableName', 'payload', 'currentUser'], returns: 'Object' },
			{ name: 'updateRecord', description: 'Mengedit data baris di tabel', params: ['tableName', 'id', 'updates', 'currentUser'], returns: 'Object' },
			{ name: 'deleteRecord', description: 'Menghapus data baris di tabel', params: ['tableName', 'id', 'currentUser'], returns: 'Object' }
		],
		requiredScopes: [
			'https://www.googleapis.com/auth/spreadsheets',
			'https://www.googleapis.com/auth/script.external_request'
		],
		workflowSummary: [
			'1. Pengguna membuka Web App dan mengakses dashboard',
			'2. Melakukan aksi pencatatan atau input formulir secara cepat',
			'3. Data tersimpan real-time ke Google Spreadsheet',
			'4. Admin dapat memantau rekapan dan mengekspor laporan'
		]
	};
}
