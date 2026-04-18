import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['resources/js/**/*.test.{ts,tsx}'],
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
})
