let API_URL: string;

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    // dev code
    API_URL = 'https://localhost:7078';
} else {
    // production code
    API_URL = 'https://webtabsyapi.azurewebsites.net';
}

export default API_URL;