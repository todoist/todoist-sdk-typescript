import { vi } from 'vitest'

/**
 * Makes `toLocaleUpperCase()` and `toLocaleLowerCase()` called without a locale behave
 * as they do in a host whose default locale is `locale`, such as a browser set to
 * Turkish, where `'i'.toLocaleUpperCase()` is `'İ'`. A running Node process can't
 * change its own default locale, so the tests emulate it. Undo with
 * `vi.restoreAllMocks()`.
 */
export function useDefaultLocale(locale: string): void {
    const toLocaleUpperCase = String.prototype.toLocaleUpperCase
    const toLocaleLowerCase = String.prototype.toLocaleLowerCase
    vi.spyOn(String.prototype, 'toLocaleUpperCase').mockImplementation(function (
        this: string,
        locales?: Intl.LocalesArgument,
    ) {
        return toLocaleUpperCase.call(this, locales ?? locale)
    })
    vi.spyOn(String.prototype, 'toLocaleLowerCase').mockImplementation(function (
        this: string,
        locales?: Intl.LocalesArgument,
    ) {
        return toLocaleLowerCase.call(this, locales ?? locale)
    })
}
