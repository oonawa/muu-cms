import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContentCreate from './index'

vi.mock('@inertiajs/react', () => ({
    router: {
        post: vi.fn(),
        visit: vi.fn(),
    },
    usePage: vi.fn(),
}))

import { router, usePage } from '@inertiajs/react'

const mockRouter = router as { post: ReturnType<typeof vi.fn>; visit: ReturnType<typeof vi.fn> }
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
}

beforeEach(() => {
    vi.clearAllMocks()
    mockUsePage.mockReturnValue({ props: { flash: {} } })
})

describe('ContentCreate', () => {
    it('パラメータのlabelがフォームラベルとして表示される', () => {
        render(<ContentCreate {...baseProps} />)
        expect(screen.getByText('タイトル')).toBeInTheDocument()
    })

    it('必須パラメータにはアスタリスクが表示される', () => {
        render(<ContentCreate {...baseProps} />)
        expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('テキスト入力ができる', () => {
        render(<ContentCreate {...baseProps} />)
        const input = screen.getByRole('textbox', { name: /タイトル/ })
        fireEvent.change(input, { target: { value: 'テスト記事' } })
        expect((input as HTMLInputElement).value).toBe('テスト記事')
    })

    it('フォーム送信するとPOSTが呼ばれる', () => {
        render(<ContentCreate {...baseProps} />)
        const input = screen.getByRole('textbox', { name: /タイトル/ })
        fireEvent.change(input, { target: { value: 'テスト記事' } })
        fireEvent.click(screen.getByRole('button', { name: '作成する' }))
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/spaces/1/blueprints/2/contents',
            { title: 'テスト記事' },
        )
    })

    it('キャンセルボタンを押すとBlueprint詳細ページに遷移する', () => {
        render(<ContentCreate {...baseProps} />)
        fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
        expect(mockRouter.visit).toHaveBeenCalledWith('/spaces/1/blueprints/2')
    })

    it('flash.successがあるときトーストが表示される', () => {
        mockUsePage.mockReturnValue({ props: { flash: { success: 'コンテンツを作成しました。' } } })
        render(<ContentCreate {...baseProps} />)
        expect(screen.getByText('コンテンツを作成しました。')).toBeInTheDocument()
    })

    it('max_lengthが設定されているパラメータはinputのmaxLengthに反映される', () => {
        const props = {
            ...baseProps,
            parameters: [
                {
                    ...baseProps.parameters[0],
                    constraint: { max_length: 50 },
                },
            ],
        }
        render(<ContentCreate {...props} />)
        const input = screen.getByRole('textbox', { name: /タイトル/ })
        expect((input as HTMLInputElement).maxLength).toBe(50)
    })
})
