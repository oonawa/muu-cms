import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Space from './index'

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    router: {
        visit: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

import { usePage, router } from '@inertiajs/react'

const mockUsePage = usePage as ReturnType<typeof vi.fn>
const mockRouter = router as {
    visit: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
}

type Blueprint = {
    id: number
    slug: string
    name: string
    type: 'single' | 'multiple'
}

const baseProps = {
    space: { id: 1, name: 'テストハコ' },
    blueprints: [] as Blueprint[],
    errors: {},
}

function setup(props: Partial<typeof baseProps> = {}) {
    mockUsePage.mockReturnValue({ props: { ...baseProps, ...props } })
    return render(<Space />)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('モノ一覧表示', () => {
    it('blueprints が一覧表示される', () => {
        setup({
            blueprints: [
                { id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' },
                { id: 2, slug: 'about', name: '自己紹介', type: 'single' },
            ],
        })
        expect(screen.getByText('ブログ')).toBeInTheDocument()
        expect(screen.getByText('自己紹介')).toBeInTheDocument()
    })

    it('カードをクリックすると /spaces/{space.id}/blueprints/{blueprint.id} へ遷移する', () => {
        setup({
            blueprints: [{ id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' }],
        })
        fireEvent.click(screen.getByText('ブログ'))
        expect(mockRouter.visit).toHaveBeenCalledWith('/spaces/1/blueprints/1')
    })
})

describe('空状態', () => {
    it('blueprints が0件のとき空状態が表示される', () => {
        setup({ blueprints: [] })
        expect(screen.getByText('モノがありません')).toBeInTheDocument()
    })
})

describe('新規作成モーダル', () => {
    it('新規作成ボタンを押すとモーダルが開く', () => {
        setup()
        fireEvent.click(screen.getByRole('button', { name: '新規作成' }))
        expect(screen.getByText('モノのタイプを選んでください')).toBeInTheDocument()
    })

    it('タイプ選択前は次へボタンが非活性', () => {
        setup()
        fireEvent.click(screen.getByRole('button', { name: '新規作成' }))
        expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()
    })

    it('タイプ選択後に次へボタンが活性化する', () => {
        setup()
        fireEvent.click(screen.getByRole('button', { name: '新規作成' }))
        // ひとつカードを選択
        fireEvent.click(screen.getByLabelText('ひとつ'))
        expect(screen.getByRole('button', { name: '次へ' })).not.toBeDisabled()
    })

    it('次へを押すと名前・slug入力ステップに進む', () => {
        setup()
        fireEvent.click(screen.getByRole('button', { name: '新規作成' }))
        fireEvent.click(screen.getByLabelText('ひとつ'))
        fireEvent.click(screen.getByRole('button', { name: '次へ' }))
        expect(screen.getByPlaceholderText('モノの名前')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('slug')).toBeInTheDocument()
    })

    it('モーダルで slug・name・type を入力して作成すると POST /spaces/{space.id}/blueprints が呼ばれる', () => {
        setup()
        fireEvent.click(screen.getByRole('button', { name: '新規作成' }))
        // タイプ選択
        fireEvent.click(screen.getByLabelText('ひとつ'))
        fireEvent.click(screen.getByRole('button', { name: '次へ' }))
        // 名前・slug入力
        fireEvent.change(screen.getByPlaceholderText('モノの名前'), {
            target: { value: 'テストモノ' },
        })
        fireEvent.change(screen.getByPlaceholderText('slug'), {
            target: { value: 'test-mono' },
        })
        fireEvent.click(screen.getByRole('button', { name: '作成' }))
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/spaces/1/blueprints',
            { slug: 'test-mono', name: 'テストモノ', type: 'single' },
            expect.anything(),
        )
    })
})

describe('名前変更', () => {
    it('名前変更ボタンを押すと編集モードになる', () => {
        setup({
            blueprints: [{ id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' }],
        })
        fireEvent.click(screen.getByRole('button', { name: '名前変更' }))
        expect(screen.getByDisplayValue('ブログ')).toBeInTheDocument()
    })

    it('モノ名を変更すると PUT /spaces/{space.id}/blueprints/{blueprint.id} が呼ばれる', () => {
        setup({
            blueprints: [{ id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' }],
        })
        fireEvent.click(screen.getByRole('button', { name: '名前変更' }))
        fireEvent.change(screen.getByDisplayValue('ブログ'), {
            target: { value: '新しいブログ' },
        })
        fireEvent.click(screen.getByRole('button', { name: '保存' }))
        expect(mockRouter.put).toHaveBeenCalledWith(
            '/spaces/1/blueprints/1',
            { name: '新しいブログ' },
            expect.anything(),
        )
    })
})

describe('削除', () => {
    it('削除ボタンを押すと確認ダイアログが表示される', () => {
        setup({
            blueprints: [{ id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' }],
        })
        fireEvent.click(screen.getByRole('button', { name: '削除' }))
        expect(screen.getByText('モノを削除')).toBeInTheDocument()
    })

    it('削除確認後に DELETE /spaces/{space.id}/blueprints/{blueprint.id} が呼ばれる', () => {
        setup({
            blueprints: [{ id: 1, slug: 'blog', name: 'ブログ', type: 'multiple' }],
        })
        fireEvent.click(screen.getByRole('button', { name: '削除' }))
        fireEvent.click(screen.getByRole('button', { name: '削除する' }))
        expect(mockRouter.delete).toHaveBeenCalledWith(
            '/spaces/1/blueprints/1',
            expect.anything(),
        )
    })
})
