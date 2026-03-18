interface ImportMetaEnv {
	readonly VITE_APP_NAME?: string;
	readonly VITE_API_URL?: string;
	readonly [key: string]: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
