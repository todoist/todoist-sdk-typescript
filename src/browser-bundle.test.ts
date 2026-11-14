import { fileURLToPath } from 'node:url'
import { rolldown } from 'rolldown'

// The package root, so the bundler reads its package.json the way a
// consumer's bundler does when it bundles the SDK from node_modules.
const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))

describe('browser bundle', () => {
    it('bundles for the browser, leaving undici and the Node file APIs out', async () => {
        // Without the package's `browser` field, undici's files end up in the
        // bundle, and its `node:` imports, and the `fs` and `path` that
        // multipart uploads load only for a file path, can't be resolved for a
        // browser: a consumer's bundler fails the build on them.
        const unresolvedImports: string[] = []
        const bundle = await rolldown({
            cwd: PACKAGE_ROOT,
            input: 'src/index.ts',
            platform: 'browser',
            onLog(_level, log) {
                if (log.code === 'UNRESOLVED_IMPORT') {
                    unresolvedImports.push(log.message)
                }
            },
        })
        const { output } = await bundle.generate({ format: 'esm' })
        await bundle.close()

        const undiciModules = output
            .flatMap((file) => (file.type === 'chunk' ? file.moduleIds : []))
            .filter((id) => id.includes('/node_modules/undici/'))
        expect(unresolvedImports).toEqual([])
        expect(undiciModules).toEqual([])
    })
})
