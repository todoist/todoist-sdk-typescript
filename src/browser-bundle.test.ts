import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

// The package root, so esbuild reads its package.json the way a consumer's
// bundler does when it bundles the SDK from node_modules.
const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))

describe('browser bundle', () => {
    it('bundles for the browser, leaving undici and the Node file APIs out', async () => {
        // Without the package's `browser` field, the build fails on undici's
        // `node:` imports and on `fs` and `path`, which multipart uploads load
        // only for a file path.
        const result = await build({
            absWorkingDir: PACKAGE_ROOT,
            entryPoints: ['src/index.ts'],
            bundle: true,
            platform: 'browser',
            format: 'esm',
            write: false,
            metafile: true,
            logLevel: 'silent',
        })

        // undici's own files, not the empty `(disabled):` stand-in the
        // `browser` field puts in its place.
        const undiciInputs = Object.keys(result.metafile.inputs).filter((path) =>
            path.startsWith('node_modules/undici/'),
        )
        expect(result.errors).toEqual([])
        expect(undiciInputs).toEqual([])
    })
})
