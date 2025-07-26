class EnvironmentVariables {
  static BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  static GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  static GITHUB_REDIRECT_URI = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;
  static GITHUB_CLIENT_SECRET = process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET;
  static GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  static GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  static GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
}
export default EnvironmentVariables;    