import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Blueprint from './index'

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    router: {
        post: vi.fn(),
        delete: vi.fn(),
    },
}))

import { usePage, router } from '@inertiajs/react'

const mockUsePage = usePage as ReturnType<typeof vi.fn>
const mockRouter = router as { post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

const baseProps = {
    space: { id: 1, name: 'テストハコ' },
    blueprint: { id: 1, name: 'テストモノ' },
    parameters: [] as { id: number; name: string; label: string; type: string; sort_order: number }[],
    contents_count: 0,
    errors: {},
}

function setup(props: Partial<typeof baseProps> = {}) {
    mockUsePage.mockReturnValue({ props: { ...baseProps, ...props } })
    return render(<Blueprint />)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('スペック未定義時（parametersが空）', () => {
    it('「スペックを定義する」見出しとパラメータ追加フォームが表示される', () => {
        setup({ parameters: [] })
        expect(screen.getByText('スペックを定義する')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'パラメータを追加' })).toBeInTheDocument()
    })

    it('各パラメータ行にタイプ選択セレクトボックスが表示される', () => {
        setup({ parameters: [] })
        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '1行テキスト' })).toBeInTheDocument()
    })

    it('選択中タイプの説明文がセレクトボックスの下に表示される', () => {
        setup({ parameters: [] })
        expect(screen.getByText('改行なしのテキスト。タイトルなどに向いています。')).toBeInTheDocument()
    })

    it('パラメータ追加ボタンを押すとフォーム行が増える', () => {
        setup({ parameters: [] })
        const addButton = screen.getByRole('button', { name: 'パラメータを追加' })
        const before = screen.getAllByRole('combobox').length
        fireEvent.click(addButton)
        expect(screen.getAllByRole('combobox').length).toBe(before + 1)
    })

    it('パラメータ削除ボタンを押すとフォーム行が消える', () => {
        setup({ parameters: [] })
        // 追加してから削除
        const addButton = screen.getByRole('button', { name: 'パラメータを追加' })
        fireEvent.click(addButton)
        const before = screen.getAllByRole('combobox').length
        const deleteButtons = screen.getAllByRole('button', { name: '削除' })
        fireEvent.click(deleteButtons[0])
        expect(screen.getAllByRole('combobox').length).toBe(before - 1)
    })

    it('スペック作成ボタンを押すとPOSTが各パラメータ分呼ばれる', () => {
        setup({ parameters: [] })
        // パラメータ名を入力
        const input = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(input, { target: { value: 'title' } })
        // 追加
        fireEvent.click(screen.getByRole('button', { name: 'パラメータを追加' }))
        const inputs = screen.getAllByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(inputs[1], { target: { value: 'body' } })
        // 送信
        fireEvent.click(screen.getByRole('button', { name: 'スペック作成' }))
        expect(mockRouter.post).toHaveBeenCalledTimes(2)
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/spaces/1/blueprints/1/parameters',
            expect.objectContaining({ name: 'title', type: 'string' }),
            expect.anything(),
        )
    })
})

describe('スペック定義済み時（parametersが1件以上）', () => {
    const params = [{ id: 10, name: 'title', label: 'タイトル', type: 'string', sort_order: 0 }]

    it('「スペック編集」ボタンが表示される', () => {
        setup({ parameters: params })
        expect(screen.getByRole('button', { name: 'スペック編集' })).toBeInTheDocument()
    })

    it('スペック編集ボタンを押すとスペック編集画面になる', () => {
        setup({ parameters: params })
        fireEvent.click(screen.getByRole('button', { name: 'スペック編集' }))
        expect(screen.getByText('スペック編集')).toBeInTheDocument()
    })
})

describe('スペック編集画面', () => {
    const params = [{ id: 10, name: 'title', label: 'タイトル', type: 'string', sort_order: 0 }]

    function setupEditMode(contentsCount = 0) {
        setup({ parameters: params, contents_count: contentsCount })
        fireEvent.click(screen.getByRole('button', { name: 'スペック編集' }))
    }

    it('既存パラメータが読み取り専用で表示される（nameとtypeがdisabled）', () => {
        setupEditMode()
        const inputs = screen.getAllByDisplayValue('title')
        expect(inputs[0]).toBeDisabled()
    })

    it('既存パラメータの削除ボタンを押すとDELETEが呼ばれる', () => {
        setupEditMode()
        // 既存パラメータの削除ボタンは最初のもの
        const deleteButtons = screen.getAllByRole('button', { name: '削除' })
        fireEvent.click(deleteButtons[0])
        expect(mockRouter.delete).toHaveBeenCalledWith(
            '/spaces/1/blueprints/1/parameters/10',
        )
    })

    it('コンテンツが0件のとき更新ボタンを押すと確認ダイアログなしで送信される', () => {
        setupEditMode(0)
        // 新規行の名前入力
        const newInput = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(newInput, { target: { value: 'body' } })
        fireEvent.click(screen.getByRole('button', { name: '更新' }))
        expect(screen.queryByText('既存のコンテンツに影響が発生します。よろしいですか？')).not.toBeInTheDocument()
        expect(mockRouter.post).toHaveBeenCalled()
    })

    it('コンテンツが1件以上のとき更新ボタンを押すと確認ダイアログが表示される', () => {
        setupEditMode(1)
        const newInput = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(newInput, { target: { value: 'body' } })
        fireEvent.click(screen.getByRole('button', { name: '更新' }))
        expect(screen.getByText('既存のコンテンツに影響が発生します。よろしいですか？')).toBeInTheDocument()
    })

    it('確認ダイアログにモノ名入力フォームが表示される', () => {
        setupEditMode(1)
        const newInput = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(newInput, { target: { value: 'body' } })
        fireEvent.click(screen.getByRole('button', { name: '更新' }))
        expect(screen.getByPlaceholderText('テストモノ')).toBeInTheDocument()
    })

    it('モノ名と一致するテキストを入力すると送信ボタンが活性化される', () => {
        setupEditMode(1)
        const newInput = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(newInput, { target: { value: 'body' } })
        fireEvent.click(screen.getByRole('button', { name: '更新' }))
        const confirmInput = screen.getByPlaceholderText('テストモノ')
        fireEvent.change(confirmInput, { target: { value: 'テストモノ' } })
        const submitButton = screen.getByRole('button', { name: '送信' })
        expect(submitButton).not.toBeDisabled()
    })

    it('モノ名と一致しないテキストでは送信ボタンが無効のまま', () => {
        setupEditMode(1)
        const newInput = screen.getByPlaceholderText('パラメータ名（英数字・アンダースコア）')
        fireEvent.change(newInput, { target: { value: 'body' } })
        fireEvent.click(screen.getByRole('button', { name: '更新' }))
        const confirmInput = screen.getByPlaceholderText('テストモノ')
        fireEvent.change(confirmInput, { target: { value: '違う名前' } })
        const submitButton = screen.getByRole('button', { name: '送信' })
        expect(submitButton).toBeDisabled()
    })
})
