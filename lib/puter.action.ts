import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";
import {PUTER_WORKER_URL} from "./constants";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

const callWorker = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (!PUTER_WORKER_URL) {
        throw new Error("Missing VITE_PUTER_WORKER_URL");
    }

    const url = new URL(path, PUTER_WORKER_URL);
    const requestInit: RequestInit = {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    };

    const response = await puter.workers.exec(url.toString(), requestInit);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
            : `Worker request failed: ${response.status}`;
        throw new Error(message);
    }

    return payload as T;
};

export const createProject = async ({ item, visibility="private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return null;
    }

    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ?
        await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source', }) : null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: 'rendered', }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage)
            ? item.sourceImage
            : ''
    );

    if(!resolvedSource) {
        console.warn('Failed to host source image, skipping save.')
        return null;
    }

    const resolvedRender = hostedRender?.url
        ? hostedRender?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        const result = await callWorker<{ project: DesignItem }>("/api/projects/save", {
            method: "POST",
            body: JSON.stringify({ project: payload, visibility }),
        });

        return result.project;

    } catch (e) {
        console.log('Failed to save project', e)
        return null;
    }
};

// export const getProjects = async (): Promise<DesignItem[]> => {
//     try {
//         const result = await callWorker<{ projects: DesignItem[] }>("/api/projects/list");
//         return result.projects;
//     } catch (e) {
//         console.warn("Failed to load projects", e);
//         return [];
//     }
//};

// export const getProject = async ({ id }: { id: string }): Promise<DesignItem | null> => {
//     try {
//         const result = await callWorker<{ project: DesignItem }>(`/api/projects/get?id=${encodeURIComponent(id)}`);
//         return result.project;
//     } catch (e) {
//         console.warn("Failed to load project", e);
//         return null;
//     }
// };


export const getProjects = async () => {
    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return []
    }
    try {
        const data = await callWorker<{ projects?: DesignItem[] | null }>("/api/projects/list", {
            method: "GET",
        });
        return Array.isArray(data?.projects) ? data?.projects : [];
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    console.log("Fetching project with ID:", id);

    try {
        const data = await callWorker<{
            project?: DesignItem | null;
        }>(`/api/projects/get?id=${encodeURIComponent(id)}`, { method: "GET" });

        console.log("Fetched project data:", data);

        return data?.project ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};
