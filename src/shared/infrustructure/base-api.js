import axios from "axios";
import {authenticationInterceptor, authenticationResponseInterceptor, authenticationErrorInterceptor} from "../../tracker-mobility/security/services/authentication.interceptor.js";


const platformApi = import.meta.env.VITE_API_BASE_URL;

/**
 * @class BaseApi
 * @summary Shared HTTP client for the platform.
 * Handles JSON and multipart/form-data automatically.
 */
export class BaseApi {
  #http;

  constructor() {
    this.#http = axios.create({
      baseURL: platformApi
    });

    this.#http.interceptors.request.use(
      (config) => {
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

    // Auth interceptor with token validation
    this.#http.interceptors.request.use(authenticationInterceptor);
    
    // Response interceptor for error handling (401/403)
    this.#http.interceptors.response.use(
      authenticationResponseInterceptor,
      authenticationErrorInterceptor
    );
  }

  get http() {
    return this.#http;
  }
}
