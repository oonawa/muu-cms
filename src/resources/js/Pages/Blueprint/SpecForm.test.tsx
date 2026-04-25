import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SpecForm from './SpecForm'

describe('SpecForm', () => {
    it('ParameterRow に label フィールドが含まれる', () => {
        const onSubmit = vi.fn()
        render(<SpecForm onSubmit={onSubmit} submitLabel="作成" />)

        const labelInput = screen.getByPlaceholderText('表示名（日本語可）')
        fireEvent.change(labelInput, { target: { value: 'タイトル' } })

        fireEvent.click(screen.getByRole('button', { name: '作成' }))
        expect(onSubmit).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ label: 'タイトル' }),
            ]),
        )
    })

    it('フォームのフィールド順は「表示名 → slug（name）→ タイプ」', () => {
        render(<SpecForm onSubmit={vi.fn()} submitLabel="作成" />)
        const inputs = screen.getAllByRole('textbox')
        // 最初のテキストボックスが表示名
        expect(inputs[0]).toHaveAttribute('placeholder', '表示名（日本語可）')
        // 次がslug（name）
        expect(inputs[1]).toHaveAttribute('placeholder', 'パラメータ名（英数字・アンダースコア）')
    })
})
