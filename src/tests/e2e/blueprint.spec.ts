import { test, expect } from '@playwright/test'
import { resetDatabase, runSetupFlow } from './helpers'

test.describe('Blueprint - text型パラメータ', () => {
    test.beforeEach(async ({ page }) => {
        resetDatabase()
        const { cdpSession } = await runSetupFlow(page)
        await cdpSession.detach()

        // ハコを作成
        await page.getByRole('button', { name: '新規作成' }).click()
        await page.getByPlaceholder('ハコの名前').fill('テストハコ')
        await page.getByRole('button', { name: '作成', exact: true }).click()
        await expect(page.getByText('テストハコ')).toBeVisible()

        // ハコ詳細へ
        await page.getByText('テストハコ').click()
        await expect(page.getByRole('heading', { name: 'テストハコ' })).toBeVisible()

        // Blueprintを作成（たくさん型）
        await page.getByRole('button', { name: '新規作成' }).click()
        await page.getByRole('radio', { name: 'たくさん' }).click()
        await page.getByRole('button', { name: '次へ' }).click()
        await page.getByPlaceholder('モノの名前').fill('記事')
        await page.getByPlaceholder('slug').fill('article')
        await page.getByRole('button', { name: '作成', exact: true }).click()
        await expect(page.getByText('記事')).toBeVisible()

        // Blueprint詳細へ
        await page.getByText('記事').click()
        await expect(page.getByRole('heading', { name: '記事' })).toBeVisible()
    })

    test('スペック追加フォームに「複数行テキスト」の選択肢が表示される', async ({ page }) => {
        const select = page.locator('select').first()
        await expect(select.locator('option[value="text"]')).toHaveText('複数行テキスト')
    })

    test('text型スペックを持つBlueprintでコンテンツ新規作成時にtextareaが表示され改行を含む値を保存できる', async ({ page }) => {
        // スペックを定義（text型）
        const labelInput = page.getByPlaceholder('表示名（日本語可）')
        const nameInput = page.getByPlaceholder('パラメータ名（英数字・アンダースコア）')
        const typeSelect = page.locator('select').first()

        await labelInput.fill('本文')
        await nameInput.fill('body')
        await typeSelect.selectOption('text')
        await page.getByRole('button', { name: 'スペック作成' }).click()

        await expect(page.getByRole('heading', { name: 'コンテンツ' })).toBeVisible()

        // コンテンツ新規作成
        await page.getByRole('button', { name: '新規作成' }).click()
        await expect(page).toHaveURL(/\/contents\/create/)

        // textareaが表示されること
        const textarea = page.locator('textarea[name="body"]')
        await expect(textarea).toBeVisible()

        // 改行を含む値を入力して保存
        await textarea.fill('1行目\n2行目')
        await page.getByRole('button', { name: '作成する' }).click()

        // Blueprint詳細に戻ること
        await expect(page).toHaveURL(/\/blueprints\//)
    })
})
