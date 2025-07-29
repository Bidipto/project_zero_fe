class EnvironmentVariables {
  static BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  static validate() {
    const required = [
      { key: 'NEXT_PUBLIC_GITHUB_CLIENT_ID', value: this.GITHUB_CLIENT_ID },
      { key: 'NEXT_PUBLIC_GITHUB_REDIRECT_URI', value: this.GITHUB_REDIRECT_URI }
    ];
    
    const missing = required.filter(({ value }) => !value).map(({ key }) => key);
    
    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      // In development, log error but don't throw to prevent build failures
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }
  }
}

// Validate on module load
if (typeof window === 'undefined') {
  // Only validate on server-side to avoid client-side errors
  EnvironmentVariables.validate();
}

export default EnvironmentVariables;