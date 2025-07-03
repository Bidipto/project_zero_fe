class EnvironmentVariables {
  static BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  static JWT_SECRET = process.env.JWT_SECRET
}
export default EnvironmentVariables;    