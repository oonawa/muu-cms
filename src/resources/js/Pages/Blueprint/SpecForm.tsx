import { useState } from 'react'

export type ParameterType = 'string'

export type ParameterTypeDefinition = {
    value: ParameterType
    label: string
    description: string
}

export const PARAMETER_TYPES: ParameterTypeDefinition[] = [
    {
        value: 'string',
        label: '1行テキスト',
        description: '改行なしのテキスト。タイトルなどに向いています。',
    },
]

export type ParameterRow = {
    id: string
    name: string
    type: ParameterType
}

type Props = {
    onSubmit: (rows: ParameterRow[]) => void
    submitLabel: string
}

export default function SpecForm({ onSubmit, submitLabel }: Props) {
    const [rows, setRows] = useState<ParameterRow[]>([
        { id: crypto.randomUUID(), name: '', type: 'string' },
    ])

    function addRow() {
        setRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: '', type: 'string' },
        ])
    }

    function removeRow(id: string) {
        setRows((prev) => prev.filter((r) => r.id !== id))
    }

    function updateRow(id: string, field: keyof Omit<ParameterRow, 'id'>, value: string) {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
        )
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        onSubmit(rows)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
                {rows.map((row) => {
                    const typeDef = PARAMETER_TYPES.find((t) => t.value === row.type)
                    return (
                        <div key={row.id} className="flex flex-col gap-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                    placeholder="パラメータ名（英数字・アンダースコア）"
                                    className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                                />
                                <select
                                    value={row.type}
                                    onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                                >
                                    {PARAMETER_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeRow(row.id)}
                                    className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                                >
                                    削除
                                </button>
                            </div>
                            {typeDef && (
                                <p className="text-xs text-[var(--color-text-muted)] pl-1">
                                    {typeDef.description}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="flex gap-2 mt-4">
                <button
                    type="button"
                    onClick={addRow}
                    className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    パラメータを追加
                </button>
            </div>
            <div className="mt-6">
                <button
                    type="submit"
                    className="rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] px-6 py-2.5 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    )
}
