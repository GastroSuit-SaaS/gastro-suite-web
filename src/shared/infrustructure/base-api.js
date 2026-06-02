import axios from 'axios';
import { getActivePinia } from 'pinia';
import { clearSessionStorage, SESSION_KEYS } from './session-storage.js';

const platformApi =
    import.meta.env.VITE_PLATFORM_API_URL || 'https://gastro-api-preprod-production-1ece.up.railway.app/api/v1';


/** Rutas que no deben llevar JWT (login/registro). */  
function isPublicAuthRequest(url = '') {
    return url.includes('/auth/') || url.includes('/support/auth');
}

/**
 * Cliente HTTP compartido de la plataforma.
 */
export class BaseApi {
  #http;

  constructor() {
    this.#http = axios.create({
      baseURL: platformApi,
      timeout: 10000,
    });

    this.#http.interceptors.request.use(
      (config) => {
        const url = config.url ?? '';
        const isAuthRoute = isPublicAuthRequest(url);

        if (!isAuthRoute) {
          const token = localStorage.getItem(SESSION_KEYS.TOKEN);
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }

          const branchId = localStorage.getItem(SESSION_KEYS.BRANCH_ID);
          if (branchId) {
            config.headers['X-Branch-Id'] = branchId;
          }
        }

        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        } else if (config.data) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.#http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !isPublicAuthRequest(error.config?.url ?? '')) {
          const pinia = getActivePinia();
          if (pinia) {
            import('../../iam/application/iam.store.js').then(({ useIamStore }) => {
              const iam = useIamStore(pinia);
              iam.logout();
              iam.error = null;
            });
          } else {
            clearSessionStorage();
          }

          const path = window.location?.pathname ?? '';
          if (!path.includes('/sign-in')) {
            import('../../router/index.js').then(({ default: router }) => {
              router.replace('/sign-in');
            });
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get http() {
    return this.#http;
  }
}
