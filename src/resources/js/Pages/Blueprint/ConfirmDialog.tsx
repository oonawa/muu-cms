import { useState } from 'react'

type Props = {
    blueprintName: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({ blueprintName, onConfirm, onCancel }: Props) {
    const [inputValue, setInputValue] = useState('')
    const isMatch = inputValue === blueprintName

    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            onClick={onCancel}
        >
            <div
                className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-sm animate-[modal-in_0.4s_var(--ease-spring)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-medium mb-2">スペック更新の確認</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    既存のコンテンツに影響が発生します。よろしいですか？
                </p>
                <p className="text-sm mb-2">
                    確認のため「{blueprintName}」と入力してください。
                </p>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={blueprintName}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                />
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onConfirm}
                        disabled={!isMatch}
                        className="flex-1 rounded-lg bg-[var(--color-error)] text-white py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        送信
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-[var(--color-border)] py-3 text-sm text-[var(--color-text-muted)]"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    )
}
