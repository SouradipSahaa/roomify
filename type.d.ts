interface AuthState{
    isSignedIn: boolean;
    userName: string | null,
    userId: string | null,
}

type AuthContext ={
    isSignedIn: boolean;
    userName: string | null,
    userId: string | null,
    refreshAuth: () => Promise<boolean>;
    signIn: () => Promise<boolean>;
    signOut: () => Promise<boolean>;
}

interface StoreHostedImageParams {
    hosting: HostingConfig | null;
    url: string;
    projectId: string;
    label: "source" | "rendered";
}
interface CreateProjectParams {
    item: DesignItem;
    visibility?: "private" | "public";
}

interface DesignItem {
    id: string;
    name?: string | null;
    sourceImage: string;
    sourcePath?: string | null;
    renderedImage?: string | null;
    renderedPath?: string | null;
    publicPath?: string | null;
    timestamp: number;
    ownerId?: string | null;
    sharedBy?: string | null;
    sharedAt?: string | null;
    isPublic?: boolean;
}

