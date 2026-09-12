import type { GASFile, PRDSpec } from '$lib/types';

export interface GoogleTokens {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
}

export interface DeploymentResult {
	success: boolean;
	scriptId?: string;
	scriptUrl?: string;
	deployedUrl?: string;
	spreadsheetUrl?: string;
	error?: string;
}

export const REQUIRED_GOOGLE_SCOPES = [
	'https://www.googleapis.com/auth/script.projects',
	'https://www.googleapis.com/auth/script.deployments',
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/spreadsheets'
];

/**
 * Generate Google OAuth 2.0 Authorization URL
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string, state?: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: REQUIRED_GOOGLE_SCOPES.join(' '),
		access_type: 'offline',
		prompt: 'consent',
		state: state || 'gas_deploy'
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access Tokens
 */
export async function exchangeCodeForTokens(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<GoogleTokens> {
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to exchange token: ${err}`);
	}

	return await res.json();
}

/**
 * Deploy or Update Multi-File GAS Web App to User's Google Account via Apps Script REST API
 */
export async function deployToGoogleAccount(
	accessToken: string,
	files: GASFile[],
	prd: PRDSpec,
	existingScriptId?: string,
	existingSpreadsheetUrl?: string
): Promise<DeploymentResult> {
	try {
		// 1. Spreadsheet DB: Reuse existing if available, or create new
		let spreadsheetUrl = existingSpreadsheetUrl || '';
		if (!spreadsheetUrl) {
			try {
				console.log('[Deploy] Creating new Google Spreadsheet database...');
				const sheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						properties: {
							title: prd.spreadsheetName || `DB - ${prd.appName}`
						}
					})
				});
				if (sheetRes.ok) {
					const sheetData = await sheetRes.json();
					spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetData.spreadsheetId}/edit`;
				}
			} catch (e) {
				console.warn('Could not auto-create spreadsheet via Sheets API:', e);
			}
		} else {
			console.log('[Deploy] Reusing existing spreadsheet database:', spreadsheetUrl);
		}

		let scriptId = existingScriptId;

		// 2. Create Google Apps Script Project if not existing
		if (!scriptId) {
			console.log('[Deploy] Creating new Apps Script project...');
			const createProjectRes = await fetch('https://script.googleapis.com/v1/projects', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: prd.appName || 'My GAS Web App'
				})
			});

			if (!createProjectRes.ok) {
				const err = await createProjectRes.text();
				throw new Error(`Apps Script project creation failed: ${err}`);
			}

			const projectData = await createProjectRes.json();
			scriptId = projectData.scriptId;
		} else {
			console.log('[Deploy] Updating existing Apps Script project:', scriptId);
		}

		const scriptUrl = `https://script.google.com/d/${scriptId}/edit`;

		// 3. Upload Project Files (Code.gs, Setup.gs, index.html, appsscript.json)
		const sanitizedFiles = sanitizeAndDeduplicateGASFiles(files);
		console.log('[Deploy] Uploading sanitized project files:', sanitizedFiles.map(f => `${f.name} (${f.type})`));

		const apiFiles = sanitizedFiles.map((f) => ({
			name: f.name,
			type: f.type,
			source: f.source
		}));

		const updateContentRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				files: apiFiles
			})
		});

		if (!updateContentRes.ok) {
			const err = await updateContentRes.text();
			throw new Error(`Uploading project files failed: ${err}`);
		}

		// 4. Create Script Version
		const createVersionRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				description: `v${new Date().toISOString().slice(0, 16).replace('T', ' ')} Release`
			})
		});

		let versionNumber = 1;
		if (createVersionRes.ok) {
			const vData = await createVersionRes.json();
			versionNumber = vData.versionNumber || 1;
		}

		// 5. Update Existing Web App Deployment or Create New Deployment
		let deployedUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
		let isDeploymentUpdated = false;

		try {
			// Check if deployment already exists for this project
			const listDeployRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			if (listDeployRes.ok) {
				const deployList = await listDeployRes.json();
				const existingDeployments = (deployList.deployments || []).filter((d: any) => d.deploymentId !== 'HEAD');
				const webappDeploy = existingDeployments[0];

				if (webappDeploy && webappDeploy.deploymentId) {
					console.log(`[Deploy] Updating existing deployment ${webappDeploy.deploymentId} to version ${versionNumber}...`);
					const updateDeployRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/${webappDeploy.deploymentId}`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							deploymentConfig: {
								versionNumber: versionNumber,
								manifestFileName: 'appsscript',
								description: `v${versionNumber} Synced Update`
							}
						})
					});

					if (updateDeployRes.ok) {
						const updatedDeployData = await updateDeployRes.json();
						if (updatedDeployData.entryPoints && updatedDeployData.entryPoints[0]?.webApp?.url) {
							deployedUrl = updatedDeployData.entryPoints[0].webApp.url;
						} else if (webappDeploy.entryPoints && webappDeploy.entryPoints[0]?.webApp?.url) {
							deployedUrl = webappDeploy.entryPoints[0].webApp.url;
						}
						isDeploymentUpdated = true;
						console.log('[Deploy] Successfully updated existing deployment! URL:', deployedUrl);
					} else {
						console.warn('[Deploy] Could not update existing deployment, will create new one:', await updateDeployRes.text());
					}
				}
			}
		} catch (listErr) {
			console.warn('[Deploy] Error inspecting existing deployments:', listErr);
		}

		if (!isDeploymentUpdated) {
			console.log('[Deploy] Creating new Web App deployment...');
			const createDeployRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					versionNumber: versionNumber,
					manifestFileName: 'appsscript',
					description: 'Automated Web App Deployment'
				})
			});

			if (createDeployRes.ok) {
				const deployData = await createDeployRes.json();
				if (deployData.entryPoints && deployData.entryPoints[0]?.webApp?.url) {
					deployedUrl = deployData.entryPoints[0].webApp.url;
				}
			}
		}

		return {
			success: true,
			scriptId,
			scriptUrl,
			deployedUrl,
			spreadsheetUrl
		};
	} catch (error: any) {
		console.error('Deployment error:', error);
		return {
			success: false,
			error: error.message || String(error)
		};
	}
}

/**
 * Ensures files are unique by name, stripped of file extensions,
 * and valid for Google Apps Script REST API requirements.
 */
export function sanitizeAndDeduplicateGASFiles(files: GASFile[]): GASFile[] {
	const fileMap = new Map<string, GASFile>();

	for (const f of files) {
		if (!f || !f.source) continue;

		// Strip extensions like .html, .gs, .js, .json
		let cleanName = f.name.replace(/\.(html|gs|js|json)$/i, '').trim();

		let cleanType: 'SERVER_JS' | 'HTML' | 'JSON' = f.type;
		if (cleanName.toLowerCase() === 'appsscript') {
			cleanName = 'appsscript';
			cleanType = 'JSON';
		} else if (cleanName.toLowerCase() === 'index' || f.type === 'HTML') {
			cleanName = 'index';
			cleanType = 'HTML';
		} else if (cleanName.toLowerCase() === 'code') {
			cleanName = 'Code';
			cleanType = 'SERVER_JS';
		} else if (cleanName.toLowerCase() === 'setup') {
			cleanName = 'Setup';
			cleanType = 'SERVER_JS';
		}

		const key = cleanName.toLowerCase();

		if (fileMap.has(key)) {
			const existing = fileMap.get(key)!;
			// Keep the file with longer or more complete source
			if ((f.source || '').length > (existing.source || '').length) {
				fileMap.set(key, {
					name: cleanName,
					type: cleanType,
					source: f.source,
					description: f.description || existing.description
				});
			}
		} else {
			fileMap.set(key, {
				name: cleanName,
				type: cleanType,
				source: f.source,
				description: f.description
			});
		}
	}

	// Ensure appsscript manifest is present
	if (!fileMap.has('appsscript')) {
		fileMap.set('appsscript', {
			name: 'appsscript',
			type: 'JSON',
			description: 'Google Apps Script Manifest & Web App Config',
			source: JSON.stringify(
				{
					timeZone: 'Asia/Jakarta',
					dependencies: {},
					exceptionLogging: 'STACKDRIVER',
					runtimeVersion: 'V8',
					webapp: {
						executeAs: 'USER_DEPLOYING',
						access: 'ANYONE'
					}
				},
				null,
				2
			)
		});
	}

	// Order: appsscript first, then Code, Setup, index, then any other files
	const preferredOrder = ['appsscript', 'code', 'setup', 'index'];
	const orderedFiles: GASFile[] = [];

	for (const key of preferredOrder) {
		if (fileMap.has(key)) {
			orderedFiles.push(fileMap.get(key)!);
			fileMap.delete(key);
		}
	}

	for (const [, file] of fileMap) {
		orderedFiles.push(file);
	}

	return orderedFiles;
}

