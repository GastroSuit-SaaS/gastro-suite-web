import axios from 'axios';
import { getActivePinia } from 'pinia';
import { clearAllAppLocalStorage, SESSION_KEYS } from './session-storage.js';
import { resetApplicationStores } from '../application/reset-application-stores.js';
import { getPlatformApiUrl } from './env.js';

const platformApi = getPlatformApiUrl();


/** Rutas IAM anónimas — no enviar JWT ni cerrar sesión en 401. */
const PUBLIC_AUTH_PATHS = Object.freeze([
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/register-owner',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/platform/bootstrap',
]);

function isPublicAuthRequest(url = '') {
    return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
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
        const url = error.config?.url ?? '';
        const skipLogout = error.config?.skipSessionLogout === true;
        const headers = error.config?.headers ?? {};
        const sentAuth = Boolean(headers.Authorization ?? headers.authorization);

        if (
          error.response?.status === 401
          && !isPublicAuthRequest(url)
          && !skipLogout
          && sentAuth
        ) {
          const pinia = getActivePinia();
          if (pinia) {
            import('../../iam/application/iam.store.js').then(({ useIamStore }) => {
              const iam = useIamStore(pinia);
              iam.logout();
              iam.error = null;
            });
          } else {
            resetApplicationStores();
            clearAllAppLocalStorage();
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
