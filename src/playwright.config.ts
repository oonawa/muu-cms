import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    workers: 1,
    use: {
        baseURL: 'http://localhost:8080',
        browserName: 'chromium',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
})
