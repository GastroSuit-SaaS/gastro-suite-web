import axios from 'axios';

const platformApi = import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:8080/api';

/**
 * @class BaseApi
 * @summary Shared HTTP client for the platform.
 * Handles JSON and multipart/form-data automatically.
 */
export class BaseApi {
  #http;

  constructor() {
    this.#http = axios.create({
      baseURL: platformApi,
      timeout: 10000, // 10s — evita que el browser se cuelgue si el backend no responde
    });

    this.#http.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('gs_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        const branchId = localStorage.getItem('gs_branch_id');
        if (branchId) {
          config.headers['X-Branch-Id'] = branchId;
        }

        if (config.data instanceof FormData) {
          // Let the browser set multipart/form-data + boundary
          delete config.headers['Content-Type'];
        } else if (config.data) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor — handle 401 globally
    this.#http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('gs_token');
          // Use dynamic import to avoid circular dependency with router
          import('../../router/index.js').then(({ default: router }) => {
            router.replace('/sign-in');
          });
        }
        return Promise.reject(error);
      }
    );
  }

  get http() {
    return this.#http;
  }
}
