import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContentEdit from './index'

vi.mock('@inertiajs/react', () => ({
    router: {
        put: vi.fn(),
        visit: vi.fn(),
    },
    usePage: vi.fn(),
}))

import { router, usePage } from '@inertiajs/react'

const mockRouter = router as { put: ReturnType<typeof vi.fn>; visit: ReturnType<typeof vi.fn> }
const mockUsePage = usePage as ReturnType<typeof vi.fn>

const baseProps = {
    space: { id: 1, name: 'テストハコ' },
    blueprint: { id: 2, name: 'ブログ' },
    parameters: [
        {
            id: 10,
            name: 'title',
            label: 'タイトル',
            type: 'string',
            is_required: true,
            sort_order: 0,
            constraint: null,
        },
    ],
    content: {
        id: 5,
        blueprint_id: 2,
        data: { title: '既存タイトル' },
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
    },
}

beforeEach(() => {
    vi.clearAllMocks()
    mockUsePage.mockReturnValue({ props: { flash: {} } })
})

describe('ContentEdit', () => {
    it('既存のコンテンツデータがフォームの初期値として表示される', () => {
        render(<ContentEdit {...baseProps} />)
        const input = screen.getByRole('textbox', { name: /タイトル/ })
        expect((input as HTMLInputElement).value).toBe('既存タイトル')
    })

    it('値を変更してフォーム送信するとPUTが呼ばれる', () => {
        render(<ContentEdit {...baseProps} />)
        const input = screen.getByRole('textbox', { name: /タイトル/ })
        fireEvent.change(input, { target: { value: '更新タイトル' } })
        fireEvent.click(screen.getByRole('button', { name: '保存する' }))
        expect(mockRouter.put).toHaveBeenCalledWith(
            '/spaces/1/blueprints/2/contents/5',
            { title: '更新タイトル' },
        )
    })

    it('キャンセルボタンを押すとBlueprint詳細ページに遷移する', () => {
        render(<ContentEdit {...baseProps} />)
        fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
        expect(mockRouter.visit).toHaveBeenCalledWith('/spaces/1/blueprints/2')
    })

    it('flash.successがあるときトーストが表示される', () => {
        mockUsePage.mockReturnValue({ props: { flash: { success: 'コンテンツを更新しました。' } } })
        render(<ContentEdit {...baseProps} />)
        expect(screen.getByText('コンテンツを更新しました。')).toBeInTheDocument()
    })
})
