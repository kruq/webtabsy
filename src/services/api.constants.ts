const DEFAULT_DEV_API_URL = 'https://localhost:7078';
const DEFAULT_PROD_API_URL = 'https://webtabsyapi.azurewebsites.net';

const fromEnv = process.env.REACT_APP_API_URL;
const fromNodeEnv = process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL;

const API_URL: string = fromEnv && fromEnv.length > 0 ? fromEnv : fromNodeEnv;

export default API_URL;
