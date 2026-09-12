export type MessageRole = 'user' | 'assistant' | 'system';

export interface FeatureItem {
	id: string;
	category: string;
	title: string;
	description: string;
	selected: boolean;
	icon?: string;
}

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string;
	timestamp: string;
	suggestedReplies?: string[];
	featureRecommendations?: FeatureItem[];
	isStreaming?: boolean;
}

export interface SheetColumnSchema {
	name: string;
	type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
	description?: string;
}

export interface SheetSchema {
	name: string;
	description: string;
	headers: string[];
}

export interface NavigationItem {
	title: string;
	icon?: string;
	targetView: string;
	badge?: string;
}

export interface NavigationGroup {
	title: string;
	icon?: string;
	children: NavigationItem[];
}

export interface ViewArchitecture {
	viewId: string;
	title: string;
	type: 'dashboard_kpi' | 'kanban_board' | 'master_detail' | 'grid_cards' | 'wizard_form' | 'table_pro';
	primaryTable: string;
	relatedTables?: string[];
	description: string;
	features?: string[];
}

export interface UIUXSpec {
	designSystem?: {
		themeColor: string;
		fontFamily: string;
		visualStyle: string;
	};
	navigation?: {
		sidebar: (NavigationItem | NavigationGroup)[];
	};
	views?: ViewArchitecture[];
}

export interface ImplementationPhase {
	phaseNumber: number;
	name: string;
	description: string;
	deliverables: string[];
}

export interface PRDSpec {
	appName: string;
	tagline: string;
	summary: string;
	domain?: string;
	appType: 'webapp' | 'automation' | 'webhook';
	spreadsheetName: string;
	sheets: SheetSchema[];
	features?: FeatureItem[];
	customFeatures?: string[];
	navigation?: {
		sidebar: (NavigationItem | NavigationGroup)[];
	};
	uiUxSpec?: UIUXSpec;
	uiFeatures?: {
		theme: string;
		views: { title: string; description: string; elements: string[] }[];
	};
	implementationPhases?: ImplementationPhase[];
	backendFunctions: {
		name: string;
		description: string;
		params: string[];
		returns: string;
	}[];
	requiredScopes: string[];
	workflowSummary: string[];
}

export interface GASFile {
	name: string; // e.g. 'Code', 'index', 'Setup', 'appsscript'
	type: 'SERVER_JS' | 'HTML' | 'JSON';
	source: string;
	description?: string;
}

export interface ProjectState {
	id: string;
	title: string;
	status: 'interview' | 'prd_review' | 'generating_code' | 'code_ready' | 'deploying' | 'deployed';
	messages: ChatMessage[];
	prd: PRDSpec | null;
	files: GASFile[];
	activeFileIndex: number;
	deployedUrl?: string;
	spreadsheetUrl?: string;
	scriptId?: string;
	lastUpdated: string;
}

export interface DeployProgress {
	step: 'idle' | 'auth_checking' | 'creating_sheet' | 'creating_project' | 'uploading_files' | 'deploying_webapp' | 'completed' | 'error';
	percentage: number;
	statusText: string;
	error?: string;
}
