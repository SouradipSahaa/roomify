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
    const requestInit = {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    };

    const workers = (puter as unknown as {
        workers?: { exec?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
    }).workers;

    const response = workers?.exec
        ? await workers.exec(url.toString(), requestInit)
        : await fetch(url, requestInit);

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

export const createProject = async ({ item }: CreateProjectParams): Promise<DesignItem | null | undefined> => {

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
            body: JSON.stringify({ project: payload }),
        });

        return result.project;

    } catch (e) {
        console.log('Failed to save project', e)
        return null;
    }
};

export const getProjects = async (): Promise<DesignItem[]> => {
    try {
        const result = await callWorker<{ projects: DesignItem[] }>("/api/projects/list");
        return result.projects;
    } catch (e) {
        console.warn("Failed to load projects", e);
        return [];
    }
};

export const getProject = async ({ id }: { id: string }): Promise<DesignItem | null> => {
    try {
        const result = await callWorker<{ project: DesignItem }>(`/api/projects/get?id=${encodeURIComponent(id)}`);
        return result.project;
    } catch (e) {
        console.warn("Failed to load project", e);
        return null;
    }
};
