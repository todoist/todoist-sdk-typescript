import { z } from 'zod'
import { getProjectUrl } from '../../utils/url-helpers'

/**
 * Base schema for all project types in Todoist.
 * Contains common fields shared between personal and workspace projects.
 */
export const BaseProjectSchema = z.object({
    id: z.string(),
    canAssignTasks: z.boolean(),
    childOrder: z.number().int(),
    orderKey: z.string().nullable().optional(),
    color: z.string(),
    /**
     * Icon name (see {@link PROJECT_ICONS}), or `null` for the default `#` icon.
     * Not an enum: the API adds icons over time, so show the default icon for a
     * name you don't recognise.
     */
    icon: z.string().nullable().optional(),
    createdAt: z.coerce.date().nullable(),
    isArchived: z.boolean(),
    isDeleted: z.boolean(),
    isFavorite: z.boolean(),
    isFrozen: z.boolean(),
    name: z.string(),
    updatedAt: z.coerce.date().nullable(),
    viewStyle: z.string(),
    defaultOrder: z.number().int(),
    defaultOrderKey: z.string().nullable().optional(),
    description: z.string(),
    isCollapsed: z.boolean(),
    isShared: z.boolean(),
})

/**
 * Schema for personal projects in Todoist.
 */
export const PersonalProjectSchema = BaseProjectSchema.extend({
    parentId: z.string().nullable(),
    inboxProject: z.boolean().optional().default(false),
}).transform((data) => {
    return {
        ...data,
        url: getProjectUrl(data.id, data.name),
    }
})

/** Available project visibility levels. */
export const PROJECT_VISIBILITIES = ['restricted', 'team', 'public'] as const
/** Visibility level of a workspace project. */
export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number]

export const ProjectVisibilitySchema = z.enum(PROJECT_VISIBILITIES)

/**
 * The fields a workspace project carries, before the SDK adds its URL. Shared by
 * {@link WorkspaceProjectSchema} and {@link WorkspaceProjectSummarySchema}.
 */
const WorkspaceProjectFieldsSchema = BaseProjectSchema.extend({
    access: z.object({ visibility: ProjectVisibilitySchema }).optional(),
    collaboratorRoleDefault: z.string(),
    folderId: z.string().nullable(),
    isInviteOnly: z.boolean().nullable(),
    isLinkSharingEnabled: z.boolean(),
    role: z.string().nullable(),
    status: z.string(),
    workspaceId: z.string(),
})

/**
 * Schema for workspace projects in Todoist.
 */
export const WorkspaceProjectSchema = WorkspaceProjectFieldsSchema.transform((data) => {
    return {
        ...data,
        url: getProjectUrl(data.id, data.name),
    }
})

/**
 * Schema for a project as listed by a workspace's project endpoints
 * (`getWorkspaceActiveProjects`, `getWorkspaceArchivedProjects`).
 *
 * Those endpoints list every workspace project the user can see, including ones
 * they haven't joined, so the payload is lighter than a {@link WorkspaceProject}.
 * The API leaves out the workspace ID; the SDK fills it in from the request.
 * `role` is `null` when the user hasn't joined the project.
 */
export const WorkspaceProjectSummarySchema = WorkspaceProjectFieldsSchema.pick({
    id: true,
    workspaceId: true,
    name: true,
    folderId: true,
    color: true,
    viewStyle: true,
    description: true,
    status: true,
    role: true,
    isInviteOnly: true,
    isFrozen: true,
    canAssignTasks: true,
    defaultOrder: true,
    defaultOrderKey: true,
    access: true,
})
    .extend({
        icon: z.string().nullable(),
        publicAccess: z.boolean(),
        publicKey: z.string(),
        isPendingDefaultCollaboratorInvites: z.boolean(),
    })
    .transform((data) => {
        return {
            ...data,
            url: getProjectUrl(data.id, data.name),
        }
    })

/**
 * A workspace project as listed by `getWorkspaceActiveProjects` or
 * `getWorkspaceArchivedProjects`. `role` is `null` when the user can see the
 * project but hasn't joined it; join it with `joinProject`.
 */
export type WorkspaceProjectSummary = z.infer<typeof WorkspaceProjectSummarySchema>

/**
 * How many active personal projects the user's plan allows, and how many they have.
 * Returned by `TodoistApi.getPersonalProjectCapacity`.
 */
export type PersonalProjectCapacity = {
    /** The current plan's limit on active personal projects. */
    maxProjects: number
    /** Active personal projects that count towards the limit. */
    activeCount: number
    /** How many more active personal projects the user can add; never negative. */
    remaining: number
}

/**
 * Represents a personal project in Todoist.
 * @see https://developer.todoist.com/api/v1/#tag/Projects
 */
export type PersonalProject = z.infer<typeof PersonalProjectSchema>

/**
 * Represents a workspace project in Todoist.
 * @see https://developer.todoist.com/api/v1/#tag/Projects
 */
export type WorkspaceProject = z.infer<typeof WorkspaceProjectSchema>

/**
 * Schema for any project type in Todoist (personal or workspace).
 * Dispatches to WorkspaceProjectSchema when workspaceId is present, PersonalProjectSchema otherwise.
 */
export const ProjectSchema = z.unknown().transform((val) => {
    if (typeof val === 'object' && val !== null && 'workspaceId' in val) {
        return WorkspaceProjectSchema.parse(val)
    }
    return PersonalProjectSchema.parse(val)
})

/** A project in Todoist — either a {@link PersonalProject} or a {@link WorkspaceProject}. */
export type Project = z.infer<typeof ProjectSchema>

/** Available project view styles. */
export const PROJECT_VIEW_STYLES = ['list', 'board', 'calendar', 'table'] as const
/**
 * View style for a project.
 * @see https://developer.todoist.com/api/v1/#tag/Projects
 */
export type ProjectViewStyle = (typeof PROJECT_VIEW_STYLES)[number]

/**
 * Icon names a project can be given, in the order the API added them.
 * The API adds icons over time; a project read back may carry a name that is
 * not listed here yet.
 */
export const PROJECT_ICONS = [
    'briefcase',
    'folder',
    'diagram',
    'headset',
    'microphone',
    'flag',
    'bullseye',
    'house',
    'heart',
    'airplane',
    'gift',
    'pin',
    'school_cap',
    'lightbulb',
    'star',
    'command_prompt',
    'laptop',
    'envelope',
    'calendar',
    'person',
    'sofa',
    'cup_and_heat_waves',
    'paintpalette',
    'broom',
    'sun_max',
    'moon',
    'beach_umbrella',
    'pizza',
    'checkmark_line_3',
    'basketball',
    'face_smiling',
    'dog',
    'dollarsign',
    'smartphone',
    'person_2',
    'chart_line_uptrend_xyaxis_in_square',
    'laboratory_flask',
    'telescope',
    'book',
    'document',
    'sparkles',
    'video',
    'paintbrush',
    'puzzlepiece_extension',
    'clock',
    'pills',
    'birthday_cake',
    'stethoscope',
    'apple',
] as const
/**
 * Name of a project icon that can be set on a project.
 * @see https://developer.todoist.com/api/v1/#tag/Projects
 */
export type ProjectIcon = (typeof PROJECT_ICONS)[number]
