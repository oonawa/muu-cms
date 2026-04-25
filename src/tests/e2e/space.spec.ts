import { test, expect } from '@playwright/test'
import { resetDatabase, runSetupFlow } from './helpers'

test.describe('ハコCRUD', () => {
    test.beforeEach(async ({ page }) => {
        resetDatabase()
        const { cdpSession } = await runSetupFlow(page)
        await cdpSession.detach()
    })

    test('ハコを作成できる', async ({ page }) => {
        await page.getByRole('button', { name: '新規作成' }).click()
        await page.getByPlaceholder('ハコの名前').fill('テストハコ')
        await page.getByRole('button', { name: '作成', exact: true }).click()

        await expect(page.getByText('テストハコ')).toBeVisible()
    })

    test('ハコの名前を変更できる', async ({ page }) => {
        // 作成
        await page.getByRole('button', { name: '新規作成' }).click()
        await page.getByPlaceholder('ハコの名前').fill('変更前')
        await page.getByRole('button', { name: '作成', exact: true }).click()
        await expect(page.getByText('変更前')).toBeVisible()

        // 名前変更
        await page.getByRole('button', { name: '名前変更' }).click()
        const input = page.getByRole('textbox')
        await input.clear()
        await input.fill('変更後')
        await page.getByRole('button', { name: '保存' }).click()

        await expect(page.getByText('変更後')).toBeVisible()
        await expect(page.getByText('変更前')).not.toBeVisible()
    })

    test('ハコを削除できる', async ({ page }) => {
        // 作成
        await page.getByRole('button', { name: '新規作成' }).click()
        await page.getByPlaceholder('ハコの名前').fill('削除するハコ')
        await page.getByRole('button', { name: '作成', exact: true }).click()
        await expect(page.getByText('削除するハコ')).toBeVisible()

        // 削除
        await page.getByRole('button', { name: '削除' }).click()
        await expect(page.getByText('この操作は取り消せません')).toBeVisible()
        await page.getByRole('button', { name: '削除する' }).click()

        await expect(page.getByText('削除するハコ')).not.toBeVisible()
        await expect(page.getByText('ハコがありません')).toBeVisible()
    })

    test('ハコが0件のとき空状態が表示される', async ({ page }) => {
        await expect(page.getByText('ハコがありません')).toBeVisible()
    })
})
