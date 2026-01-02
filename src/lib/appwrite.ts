import { Client, Account, Databases, Storage, ID, Query, OAuthProvider } from "appwrite";

// Appwrite Configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://syd.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "69577d8c003876f7d5f4";
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "labsync_db";

// Collection IDs
export const COLLECTIONS = {
    USERS: "users",
    LABS: "labs",
    PROBLEMS: "problems",
    SUBMISSIONS: "submissions",
} as const;

// Initialize Appwrite Client
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Service instances
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export utilities
export { ID, Query, OAuthProvider };

// Export client for advanced use cases
export { client };

// Database ID getter
export function getDatabaseId(): string {
    return APPWRITE_DATABASE_ID;
}

// Check if Appwrite is configured
export function isAppwriteConfigured(): boolean {
    return Boolean(APPWRITE_PROJECT_ID && APPWRITE_DATABASE_ID);
}
