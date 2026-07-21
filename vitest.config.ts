import { defineConfig } from 'vitest/config'

// Losse, minimale Vitest-config (i.p.v. hergebruik van vite.config.ts): de
// unit-tests raken alleen pure TS-logica (stoplicht/streak/badges), zonder
// DOM, zonder de PWA-plugin. Dat houdt de testrun snel en onafhankelijk van
// de build-configuratie van de app zelf.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
