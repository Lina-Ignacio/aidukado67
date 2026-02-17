
import originalAxios from 'axios'

const axios = originalAxios.create({  
    withCredentials: true,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

axios.interceptors.request.use(config => {
    // If URL doesn't start with http, add baseURL
    if (!config.url.startsWith('http')) {
        config.url = `${import.meta.env.VITE_API_URL}${config.url}`;
    }
    return config;
});

export default axios;  