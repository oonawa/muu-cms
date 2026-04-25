import { execSync } from 'child_process'
import { expect, type CDPSession, type Page } from '@playwright/test'

export function resetDatabase() {
    const cwd = process.cwd().endsWith('/src')
        ? process.cwd() + '/..'
        : process.cwd()
    execSync(
        'docker compose exec -T app php artisan migrate:fresh --force',
        { cwd, stdio: 'pipe' },
    )
}

export async function addVirtualAuthenticator(page: Page): Promise<{
    cdpSession: CDPSession
    authenticatorId: string
}> {
    const cdpSession = await page.context().newCDPSession(page)

    await cdpSession.send('WebAuthn.enable')

    const { authenticatorId } = await cdpSession.send(
        'WebAuthn.addVirtualAuthenticator',
        {
            options: {
                protocol: 'ctap2',
                transport: 'internal',
                hasResidentKey: true,
                hasUserVerification: true,
                isUserVerified: true,
            },
        },
    )

    return { cdpSession, authenticatorId }
}

/**
 * セットアップフローを実行してダッシュボードまで遷移する。
 * リカバリ情報を登録する場合は withRecovery に email/password を渡す。
 */
export async function runSetupFlow(
    page: Page,
    options?: {
        withRecovery?: { email: string; password: string }
    },
): Promise<{ cdpSession: CDPSession }> {
    const { cdpSession } = await addVirtualAuthenticator(page)

    await page.goto('/setup')

    // ステップ1: ユーザー名
    await page.getByPlaceholder('管理者の名前を入力').fill('テスト管理者')
    await page.getByRole('button', { name: '次へ' }).click()

    // ステップ2: パスキー登録
    await expect(page.getByRole('heading', { name: 'パスキーを登録' })).toBeVisible()
    await page.getByRole('button', { name: 'パスキーを登録する' }).click()

    // ステップ3: リカバリ情報
    await expect(page.getByRole('heading', { name: 'リカバリ情報' })).toBeVisible()

    if (options?.withRecovery) {
        await page.getByPlaceholder('admin@example.com').fill(options.withRecovery.email)
        await page.getByLabel('パスワード', { exact: true }).fill(options.withRecovery.password)
        await page.getByLabel('パスワード（確認）').fill(options.withRecovery.password)
        await page.getByRole('button', { name: '登録する' }).click()
    } else {
        await page.getByRole('button', { name: 'スキップ' }).click()
    }

    // ステップ4: 完了
    await expect(page.getByText('セットアップ完了')).toBeVisible()
    await page.getByRole('button', { name: 'はじめる' }).click()
    await expect(page).toHaveURL('/')

    return { cdpSession }
}
