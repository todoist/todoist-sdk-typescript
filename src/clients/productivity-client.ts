import { ENDPOINT_REST_PRODUCTIVITY } from '../consts/endpoints'
import { request } from '../transport/http-client'
import type { ProductivityStats } from '../types/productivity'
import { validateProductivityStats } from '../utils/validators'
import { BaseClient } from './base-client'

/** Fields of the productivity stats response keyed by project ID. */
const PRODUCTIVITY_STATS_ID_KEYED_FIELDS: ReadonlySet<string> = new Set(['project_colors'])

/**
 * Internal sub-client handling the productivity-stats endpoint.
 *
 * Instantiated by `TodoistApi`; the public `getProductivityStats` method
 * on `TodoistApi` delegates here. See `todoist-api.ts` for user-facing
 * JSDoc.
 */
export class ProductivityClient extends BaseClient {
    async getProductivityStats(): Promise<ProductivityStats> {
        const response = await request<ProductivityStats>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_PRODUCTIVITY,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            // Camel-casing would rewrite these IDs (`6Jf8VQXx` → `6Jf8VqXx`).
            opaqueKeyMaps: PRODUCTIVITY_STATS_ID_KEYED_FIELDS,
        })
        return validateProductivityStats(response.data)
    }
}
