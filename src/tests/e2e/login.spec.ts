import { test, expect } from '@playwright/test'
import { resetDatabase, addVirtualAuthenticator, runSetupFlow } from './helpers'

test.describe('ログイン', () => {
    test('パスキーでログインできる', async ({ page }) => {
        resetDatabase()

        // セットアップ（認証器を維持したまま）
        const { cdpSession } = await runSetupFlow(page, {
            withRecovery: {
                email: 'admin@example.com',
                password: 'securepassword123',
            },
        })

        // ログアウト
        await page.getByRole('button', { name: 'ログアウト' }).click()
        await expect(page).toHaveURL('/login')

        // 同じ認証器でパスキーログイン
        await page.getByRole('button', { name: 'パスキーでログイン' }).click()

        await expect(page).toHaveURL('/')
        await expect(page.getByText('ハコ一覧')).toBeVisible()

        await cdpSession.detach()
    })

    test('メールアドレスとパスワードでログインできる', async ({ page }) => {
        resetDatabase()
        const { cdpSession } = await runSetupFlow(page, {
            withRecovery: {
                email: 'admin@example.com',
                password: 'securepassword123',
            },
        })
        await page.getByRole('button', { name: 'ログアウト' }).click()
        await expect(page).toHaveURL('/login')
        await cdpSession.detach()

        await page.getByText('メールアドレスでログイン').click()

        await page.getByLabel('メールアドレス').fill('admin@example.com')
        await page.getByLabel('パスワード').fill('securepassword123')
        await page.getByRole('button', { name: 'ログイン', exact: true }).click()

        await expect(page).toHaveURL('/')
        await expect(page.getByText('ハコ一覧')).toBeVisible()
    })

    test('パスワードが間違っているとエラーが表示される', async ({ page }) => {
        resetDatabase()
        const { cdpSession } = await runSetupFlow(page, {
            withRecovery: {
                email: 'admin@example.com',
                password: 'securepassword123',
            },
        })
        await page.getByRole('button', { name: 'ログアウト' }).click()
        await expect(page).toHaveURL('/login')
        await cdpSession.detach()

        await page.getByText('メールアドレスでログイン').click()

        await page.getByLabel('メールアドレス').fill('admin@example.com')
        await page.getByLabel('パスワード').fill('wrongpassword')
        await page.getByRole('button', { name: 'ログイン', exact: true }).click()

        await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible()
    })
})
