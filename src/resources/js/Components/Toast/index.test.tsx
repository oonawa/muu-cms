import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Toast from './index'

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
}))

import { usePage } from '@inertiajs/react'

const mockUsePage = usePage as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
})

describe('Toast', () => {
    it('flash.successがあるとき成功メッセージが表示される', () => {
        mockUsePage.mockReturnValue({ props: { flash: { success: 'コンテンツを作成しました。' } } })
        render(<Toast />)
        expect(screen.getByText('コンテンツを作成しました。')).toBeInTheDocument()
    })

    it('flash.successがないときは何も表示されない', () => {
        mockUsePage.mockReturnValue({ props: { flash: {} } })
        render(<Toast />)
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('一定時間後にトーストが自動消去される', () => {
        mockUsePage.mockReturnValue({ props: { flash: { success: '作成しました。' } } })
        render(<Toast />)
        expect(screen.getByText('作成しました。')).toBeInTheDocument()
        act(() => {
            vi.advanceTimersByTime(4000)
        })
        expect(screen.queryByText('作成しました。')).not.toBeInTheDocument()
    })
})
