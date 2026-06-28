import { BaseApi } from '../../../shared/infrustructure/base-api.js';

export class PushTokensApi extends BaseApi {
    register(body) {
        return this.http.post('/me/push-tokens', body);
    }

    unregister(body) {
        return this.http.delete('/me/push-tokens', { data: body });
    }
}

export const pushTokensApi = new PushTokensApi();
