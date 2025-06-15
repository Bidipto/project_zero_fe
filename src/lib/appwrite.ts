import { Client } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "")

    // for later down the road
    // .setDatabaseId(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "");

export default client; 