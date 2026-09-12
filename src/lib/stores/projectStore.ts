import type { ProjectState } from '$lib/types';

const STORAGE_KEY = 'gas_builder_projects_v1';
const ACTIVE_ID_KEY = 'gas_builder_active_project_id';

export function createNewProjectState(customTitle?: string): ProjectState {
	return {
		id: 'proj-' + Date.now(),
		title: customTitle || 'Aplikasi GAS Baru',
		status: 'interview',
		messages: [],
		prd: null,
		files: [],
		activeFileIndex: 0,
		lastUpdated: new Date().toISOString()
	};
}

export function getAllProjects(): ProjectState[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch (e) {
		console.error('Failed to load projects from storage:', e);
		return [];
	}
}

export function saveProjectToStorage(project: ProjectState): void {
	if (typeof window === 'undefined') return;
	try {
		const projects = getAllProjects();
		const idx = projects.findIndex((p) => p.id === project.id);
		project.lastUpdated = new Date().toISOString();

		if (idx >= 0) {
			projects[idx] = project;
		} else {
			projects.unshift(project);
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
		localStorage.setItem(ACTIVE_ID_KEY, project.id);
	} catch (e) {
		console.error('Failed to save project:', e);
	}
}

export function deleteProjectFromStorage(id: string): ProjectState[] {
	if (typeof window === 'undefined') return [];
	try {
		const projects = getAllProjects().filter((p) => p.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
		return projects;
	} catch (e) {
		console.error('Failed to delete project:', e);
		return [];
	}
}

export function getActiveProjectId(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveProjectId(id: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(ACTIVE_ID_KEY, id);
}
