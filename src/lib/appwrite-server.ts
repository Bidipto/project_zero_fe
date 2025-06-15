import { Client, Account, Users } from "node-appwrite";

const serverClient = new Client()
	.setEndpoint(process.env.APPWRITE_ENDPOINT!)
	.setProject(process.env.APPWRITE_PROJECT_ID!)
	.setKey(process.env.APPWRITE_API_KEY!);

export const serverUsers = new Users(serverClient);
export const serverAccount = new Account(serverClient); 