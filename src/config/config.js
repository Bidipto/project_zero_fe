class EnvironmentVariables {
  static BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (() => {
    throw new Error('NEXT_PUBLIC_BACKEND_URL environment variable is required');
  })
}
export default EnvironmentVariables;