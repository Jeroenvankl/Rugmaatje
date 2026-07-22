import { describe, expect, it } from 'vitest'
import { describeStorageError } from '../storage'

function makeQuotaExceededError(): DOMException {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError')
}

describe('describeStorageError', () => {
  it('herkent een QuotaExceededError en geeft een back-up-advies', () => {
    const info = describeStorageError(makeQuotaExceededError())
    expect(info.isQuotaExceeded).toBe(true)
    expect(info.message).toMatch(/back-up/)
    expect(info.message).toMatch(/vol/)
  })

  it('herkent een oudere browser-variant via error code 22', () => {
    const legacyError = new DOMException('Quota exceeded', 'SomeOtherName')
    Object.defineProperty(legacyError, 'code', { value: 22 })
    const info = describeStorageError(legacyError)
    expect(info.isQuotaExceeded).toBe(true)
  })

  it('geeft een generieke melding voor andere opslagfouten', () => {
    const info = describeStorageError(new DOMException('Storage disabled', 'SecurityError'))
    expect(info.isQuotaExceeded).toBe(false)
    expect(info.message).toMatch(/geblokkeerd of niet beschikbaar/)
  })

  it('geeft ook een generieke melding voor niet-DOMException fouten', () => {
    const info = describeStorageError(new Error('iets onverwachts'))
    expect(info.isQuotaExceeded).toBe(false)
  })
})
