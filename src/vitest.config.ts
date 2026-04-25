import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['resources/js/test-setup.ts'],
        include: ['resources/js/**/*.test.{ts,tsx}'],
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
})
