class EnvironmentVariables {
  static BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
  static JWT_SECRET = process.env.JWT_SECRET
  static SALT = process.env.SALT || '10';  //salt will depend on 
}
export default EnvironmentVariables;    