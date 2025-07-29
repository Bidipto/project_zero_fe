class EnvironmentVariables {
  static BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
}

const validateRequiredVars = () => {
const required = ['GITHUB_CLIENT_ID', 'GITHUB_REDIRECT_URI'];
const missing = required.filter(key => !this[key]);
if (missing.length > 0) {
   throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  }
 }
export default EnvironmentVariables;