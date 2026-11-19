import { ENDPOINT_REST_ID_MAPPINGS, ENDPOINT_REST_MOVED_IDS } from '../consts/endpoints'
import { request } from '../transport/http-client'
import type { GetIdMappingsArgs, GetMovedIdsArgs, IdMapping, MovedId } from '../types/id-mappings'
import { generatePath } from '../utils/request-helpers'
import { IdSchema, validateIdMappingArray, validateMovedIdArray } from '../utils/validators'
import { BaseClient } from './base-client'

/**
 * Internal sub-client handling ID-mapping endpoints.
 *
 * Instantiated by `TodoistApi`; every public id-mapping method on
 * `TodoistApi` delegates here. See `todoist-api.ts` for user-facing
 * JSDoc.
 */
export class IdMappingClient extends BaseClient {
    async getIdMappings(args: GetIdMappingsArgs): Promise<IdMapping[]> {
        IdSchema.array().parse(args.objIds)
        const response = await request<unknown[]>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: generatePath(
                ENDPOINT_REST_ID_MAPPINGS,
                args.objName,
                args.objIds.join(','),
            ),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
        })
        return validateIdMappingArray(response.data)
    }

    async getMovedIds(args: GetMovedIdsArgs): Promise<MovedId[]> {
        const response = await request<unknown[]>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: generatePath(ENDPOINT_REST_MOVED_IDS, args.objName),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args.oldIds ? { oldIds: args.oldIds.join(',') } : undefined,
        })
        return validateMovedIdArray(response.data)
    }
}
