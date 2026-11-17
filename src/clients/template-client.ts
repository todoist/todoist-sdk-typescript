import {
    ENDPOINT_REST_PROJECTS,
    ENDPOINT_REST_PROJECTS_IMPORT,
    ENDPOINT_REST_TEMPLATES_FILE,
    ENDPOINT_REST_TEMPLATES_URL,
    ENDPOINT_REST_TEMPLATES_PREVIEW,
    ENDPOINT_REST_TEMPLATES,
    ENDPOINT_REST_TEMPLATES_CATEGORIES,
    ENDPOINT_REST_TEMPLATES_USER,
    getTemplatesBaseUri,
    ENDPOINT_REST_TEMPLATES_USER_IMPORT,
    ENDPOINT_REST_TEMPLATES_USER_PREVIEW,
    ENDPOINT_REST_PROJECTS_FROM_TEMPLATE,
    TEMPLATE_PREVIEW,
    PROJECT_IMPORT,
    PROJECT_IMPORT_TEMPLATE,
} from '../consts/endpoints'
import { request } from '../transport/http-client'
import { TodoistArgumentError } from '../types/errors'
import type {
    AddProjectFromCsvArgs,
    AddProjectFromTemplateIdArgs,
    AddProjectFromTemplateIdResponse,
    AddProjectFromCsvResponse,
    SaveProjectAsTemplateArgs,
    TemplateContent,
    TemplateContentResponse,
    AddTemplateArgs,
    GetTemplateArgs,
    GetTemplateContentArgs,
    GetTemplateCategoriesArgs,
    GetTemplatesArgs,
    GetTemplatesByIdsArgs,
    GetTemplatesResponse,
    ExportProjectAsCsvArgs,
    ExportTemplateUrlArgs,
    ExportTemplateUrlResponse,
    ImportTemplateFromIdArgs,
    ImportCsvIntoProjectArgs,
    ImportTemplateResponse,
    PreviewTemplateFromCsvArgs,
    UpdateTemplateArgs,
    TemplateFromCsvPreview,
    Template,
    TemplateCategory,
} from '../types/templates'
import { uploadMultipartFile } from '../utils/multipart-upload'
import { generatePath } from '../utils/request-helpers'
import {
    IdSchema,
    validateCommentArray,
    validateAddProjectFromTemplateIdResponse,
    validateProjectArray,
    validateSectionArray,
    validateTaskArray,
    validateTemplate,
    validateTemplateContentResponse,
    validateTemplateArray,
    validateTemplateCategoryArray,
    validateTemplateFromCsvPreview,
} from '../utils/validators'
import { BaseClient } from './base-client'

/**
 * Internal sub-client handling all template-domain endpoints.
 *
 * Instantiated by `TodoistApi`; every public template method on
 * `TodoistApi` delegates here. See `todoist-api.ts` for user-facing
 * JSDoc.
 */
export class TemplateClient extends BaseClient {
    private get templatesApiBase(): string {
        return getTemplatesBaseUri(this.syncApiBase)
    }

    async exportProjectAsCsv(args: ExportProjectAsCsvArgs): Promise<string> {
        const response = await request<string>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES_FILE,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args,
        })
        return response.data
    }

    async exportTemplateAsUrl(args: ExportTemplateUrlArgs): Promise<ExportTemplateUrlResponse> {
        const { data } = await request<ExportTemplateUrlResponse>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES_URL,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args,
        })
        return data
    }

    async addProjectFromCsv(
        args: AddProjectFromCsvArgs,
        requestId?: string,
    ): Promise<AddProjectFromCsvResponse> {
        const { file, fileName, name, workspaceId } = args
        const additionalFields: Record<string, string> = { name }
        if (workspaceId !== undefined && workspaceId !== null) {
            additionalFields.workspace_id = workspaceId
        }

        const data = await uploadMultipartFile({
            baseUrl: this.syncApiBase,
            authToken: this.authToken,
            endpoint: ENDPOINT_REST_PROJECTS_IMPORT,
            file,
            fileName,
            additionalFields,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            requestId,
        })
        return this.validateTemplateResponse(
            data as Record<string, unknown>,
        ) as AddProjectFromCsvResponse
    }

    async importCsvIntoProject(
        args: ImportCsvIntoProjectArgs,
        requestId?: string,
    ): Promise<ImportTemplateResponse> {
        const { file, fileName, projectId } = args
        IdSchema.parse(projectId)
        const data = await uploadMultipartFile({
            baseUrl: this.syncApiBase,
            authToken: this.authToken,
            endpoint: generatePath(ENDPOINT_REST_PROJECTS, projectId, PROJECT_IMPORT),
            file,
            fileName,
            additionalFields: {},
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            requestId,
        })
        return this.validateTemplateResponse(
            data as Record<string, unknown>,
        ) as ImportTemplateResponse
    }

    async importTemplateFromId(
        args: ImportTemplateFromIdArgs,
        requestId?: string,
    ): Promise<ImportTemplateResponse> {
        const { projectId, ...payload } = args
        IdSchema.parse(projectId)
        const { data } = await request<Record<string, unknown>>({
            httpMethod: 'POST',
            baseUri: this.syncApiBase,
            relativePath: generatePath(ENDPOINT_REST_PROJECTS, projectId, PROJECT_IMPORT_TEMPLATE),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload,
            requestId: requestId,
        })
        return this.validateTemplateResponse(data) as ImportTemplateResponse
    }

    async previewProjectAsTemplate(projectId: string): Promise<TemplateContentResponse> {
        IdSchema.parse(projectId)
        const { data } = await request<unknown>({
            httpMethod: 'GET',
            baseUri: this.templatesApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES_PREVIEW,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: { projectId },
        })
        return validateTemplateContentResponse(data)
    }

    async getTemplates(args: GetTemplatesArgs = {}): Promise<GetTemplatesResponse> {
        return this.requestTemplatePage(args)
    }

    async getTemplatesByIds(args: GetTemplatesByIdsArgs): Promise<GetTemplatesResponse> {
        const { ids, ...rest } = args
        return this.requestTemplatePage({ ...rest, ids: ids.join(',') })
    }

    async getTemplate(id: string, args: GetTemplateArgs = {}): Promise<Template> {
        IdSchema.parse(id)
        const { data } = await request<unknown>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: generatePath(ENDPOINT_REST_TEMPLATES, id),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args,
        })
        return validateTemplate(data)
    }

    async getTemplateCategories(args: GetTemplateCategoriesArgs = {}): Promise<TemplateCategory[]> {
        const { data } = await request<{ categories: unknown }>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES_CATEGORIES,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args,
        })
        return validateTemplateCategoryArray(data.categories)
    }

    async saveProjectAsTemplate(
        args: SaveProjectAsTemplateArgs,
        requestId?: string,
    ): Promise<Template> {
        const { templateType = 'project', content, ...rest } = args
        const { data } = await request<unknown>({
            httpMethod: 'POST',
            baseUri: this.templatesApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES_USER,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: {
                ...rest,
                templateType,
                ...(content ? { content: toApiTemplateContent(content) } : {}),
            },
            requestId: requestId,
        })
        return validateTemplate(data)
    }

    async getTemplateContent(
        templateId: string,
        args: GetTemplateContentArgs = {},
    ): Promise<TemplateContentResponse> {
        IdSchema.parse(templateId)
        const { data } = await request<unknown>({
            httpMethod: 'GET',
            baseUri: this.templatesApiBase,
            relativePath: generatePath(ENDPOINT_REST_TEMPLATES, templateId, TEMPLATE_PREVIEW),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            // Read on the same API version as the update, so dates come back as complete
            // objects that the update accepts back unchanged.
            payload: args,
        })
        const response = validateTemplateContentResponse(data)
        if (response.templateType !== 'project') {
            // Template content describes one project. Reading a setup template into it would drop
            // its other projects, the links from sections and tasks to them, and its labels.
            throw new TodoistArgumentError(
                `${templateId} is a ${response.templateType} template. getTemplateContent only reads project templates.`,
            )
        }
        return response
    }

    async updateTemplate(
        templateId: string,
        args: UpdateTemplateArgs,
        requestId?: string,
    ): Promise<Template> {
        IdSchema.parse(templateId)
        const { content, ...rest } = args
        if (content && rest.projectId) {
            throw new TodoistArgumentError(
                'updateTemplate takes either `content` or `projectId`, not both.',
            )
        }
        const payload = content ? { ...rest, content: toApiTemplateContent(content) } : rest
        const { data } = await request<unknown>({
            httpMethod: 'PUT',
            baseUri: this.templatesApiBase,
            relativePath: generatePath(ENDPOINT_REST_TEMPLATES_USER, templateId),
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload,
            requestId: requestId,
        })
        return validateTemplate(data)
    }

    async previewTemplateFromCsv(
        args: PreviewTemplateFromCsvArgs,
        requestId?: string,
    ): Promise<TemplateFromCsvPreview> {
        const data = await uploadMultipartFile({
            baseUrl: this.templatesApiBase,
            authToken: this.authToken,
            endpoint: ENDPOINT_REST_TEMPLATES_USER_PREVIEW,
            file: args.file,
            fileName: args.fileName,
            additionalFields: {},
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            requestId,
        })
        return validateTemplateFromCsvPreview(data)
    }

    async addTemplate(args: AddTemplateArgs, requestId?: string): Promise<Template> {
        const { file, fileName, uploadedFileName, content, name, description, color } = args
        const fields = { templateType: 'project', name, description, color }

        const sources = [file !== undefined, Boolean(uploadedFileName), content !== undefined]
        if (sources.filter(Boolean).length !== 1) {
            throw new TodoistArgumentError(
                'addTemplate needs exactly one of `content`, `file` or `uploadedFileName`.',
            )
        }

        if (file === undefined) {
            // A staged file or an edited draft: nothing to upload.
            const { data } = await request<unknown>({
                httpMethod: 'POST',
                baseUri: this.templatesApiBase,
                relativePath: ENDPOINT_REST_TEMPLATES_USER_IMPORT,
                apiToken: this.authToken,
                customFetch: this.customFetch,
                customHeaders: this.customHeaders,
                payload: content
                    ? { ...fields, content: toApiTemplateContent(content) }
                    : { ...fields, uploadedFileName },
                requestId: requestId,
            })
            return validateTemplate(data)
        }

        const data = await uploadMultipartFile({
            baseUrl: this.templatesApiBase,
            authToken: this.authToken,
            endpoint: ENDPOINT_REST_TEMPLATES_USER_IMPORT,
            file,
            fileName,
            additionalFields: {
                template_type: fields.templateType,
                name,
                description,
                color: String(color),
            },
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            requestId,
        })
        return validateTemplate(data)
    }

    async addProjectFromTemplateId(
        args: AddProjectFromTemplateIdArgs,
        requestId?: string,
    ): Promise<AddProjectFromTemplateIdResponse> {
        const { data } = await request<unknown>({
            httpMethod: 'POST',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_PROJECTS_FROM_TEMPLATE,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload: args,
            requestId: requestId,
        })
        return validateAddProjectFromTemplateIdResponse(data)
    }

    private async requestTemplatePage(
        payload: Record<string, unknown>,
    ): Promise<GetTemplatesResponse> {
        const {
            data: { results, nextCursor },
        } = await request<{ results: unknown; nextCursor: string | null }>({
            httpMethod: 'GET',
            baseUri: this.syncApiBase,
            relativePath: ENDPOINT_REST_TEMPLATES,
            apiToken: this.authToken,
            customFetch: this.customFetch,
            customHeaders: this.customHeaders,
            payload,
        })
        return { results: validateTemplateArray(results), nextCursor }
    }

    private validateTemplateResponse(data: Record<string, unknown>) {
        return {
            ...data,
            projects: validateProjectArray((data.projects as unknown[]) ?? []),
            sections: validateSectionArray((data.sections as unknown[]) ?? []),
            tasks: validateTaskArray((data.tasks as unknown[]) ?? []),
            comments: validateCommentArray((data.comments as unknown[]) ?? []),
        }
    }
}

function toApiTemplateContent({ tasks, comments, projectComments, ...rest }: TemplateContent) {
    return {
        ...rest,
        items: tasks,
        notes: comments.map(({ taskId, ...comment }) => ({ itemId: taskId, ...comment })),
        projectNotes: projectComments,
    }
}
