// Load the backend URL from the environment variable (EXPO_PUBLIC_BACKEND_URL in client/.env)
// Fallback to local network IP for development if the environment variable is missing
const rawUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
if (!rawUrl) {
  console.warn("WARNING: EXPO_PUBLIC_BACKEND_URL is not set in .env!");
}
export const BACKEND_URL = rawUrl || "";
