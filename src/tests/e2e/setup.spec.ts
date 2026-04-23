import { test, expect } from '@playwright/test'
import { resetDatabase, addVirtualAuthenticator } from './helpers'

test.describe('セットアップ', () => {
    test.beforeEach(() => {
        resetDatabase()
    })

    test('名前入力→パスキー登録→リカバリスキップで完了できる', async ({ page }) => {
        const { cdpSession } = await addVirtualAuthenticator(page)

        await page.goto('/')
        await expect(page).toHaveURL('/setup')

        // ステップ1: ユーザー名入力
        await page.getByPlaceholder('管理者の名前を入力').fill('テスト管理者')
        await page.getByRole('button', { name: '次へ' }).click()

        // ステップ2: パスキー登録
        await expect(page.getByRole('heading', { name: 'パスキーを登録' })).toBeVisible()
        await page.getByRole('button', { name: 'パスキーを登録する' }).click()

        // ステップ3: リカバリ情報（スキップ）
        await expect(page.getByRole('heading', { name: 'リカバリ情報' })).toBeVisible()
        await page.getByRole('button', { name: 'スキップ' }).click()

        // ステップ4: 完了
        await expect(page.getByText('セットアップ完了')).toBeVisible()
        await page.getByRole('button', { name: 'はじめる' }).click()

        // ダッシュボードへ遷移
        await expect(page).toHaveURL('/')
        await expect(page.getByText('ハコ一覧')).toBeVisible()

        await cdpSession.detach()
    })

    test('名前入力→パスキー登録→リカバリ情報登録で完了できる', async ({ page }) => {
        const { cdpSession } = await addVirtualAuthenticator(page)

        await page.goto('/setup')

        // ステップ1
        await page.getByPlaceholder('管理者の名前を入力').fill('テスト管理者')
        await page.getByRole('button', { name: '次へ' }).click()

        // ステップ2
        await expect(page.getByRole('heading', { name: 'パスキーを登録' })).toBeVisible()
        await page.getByRole('button', { name: 'パスキーを登録する' }).click()

        // ステップ3: リカバリ情報入力
        await expect(page.getByRole('heading', { name: 'リカバリ情報' })).toBeVisible()
        await page.getByPlaceholder('admin@example.com').fill('admin@example.com')
        await page.getByLabel('パスワード', { exact: true }).fill('securepassword123')
        await page.getByLabel('パスワード（確認）').fill('securepassword123')
        await page.getByRole('button', { name: '登録する' }).click()

        // ステップ4: 完了
        await expect(page.getByText('セットアップ完了')).toBeVisible()

        await cdpSession.detach()
    })

    test('ユーザーが存在する場合セットアップ画面にアクセスできない', async ({ page }) => {
        const { cdpSession } = await addVirtualAuthenticator(page)

        // 先にユーザーを作成
        await page.goto('/setup')
        await page.getByPlaceholder('管理者の名前を入力').fill('既存ユーザー')
        await page.getByRole('button', { name: '次へ' }).click()

        // 別リクエストでセットアップにアクセス
        const response = await page.request.get('/setup')
        expect(response.status()).toBe(403)

        await cdpSession.detach()
    })
})
