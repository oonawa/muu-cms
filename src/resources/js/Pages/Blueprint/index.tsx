import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import SpecForm, { type ParameterRow } from './SpecForm'
import ConfirmDialog from './ConfirmDialog'

type Space = {
    id: number
    name: string
}

type Blueprint = {
    id: number
    name: string
}

type Parameter = {
    id: number
    name: string
    label: string
    type: string
    sort_order: number
}

type Content = {
    id: number
    blueprint_id: number
    data: Record<string, unknown>
    created_at: string
    updated_at: string
}

type ViewState = 'default' | 'spec-edit'

export default function Blueprint() {
    const { space, blueprint, parameters, contents, contents_count } = usePage<{
        space: Space
        blueprint: Blueprint
        parameters: Parameter[]
        contents: Content[]
        contents_count: number
    }>().props

    const [viewState, setViewState] = useState<ViewState>('default')
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingRows, setPendingRows] = useState<ParameterRow[]>([])

    const hasParameters = parameters.length > 0

    function handleSpecCreate(rows: ParameterRow[]) {
        function postNext(index: number) {
            if (index >= rows.length) return
            const row = rows[index]
            router.post(
                `/spaces/${space.id}/blueprints/${blueprint.id}/parameters`,
                {
                    name: row.name,
                    label: row.name,
                    type: row.type,
                    is_required: false,
                    sort_order: index,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => postNext(index + 1),
                },
            )
        }
        postNext(0)
    }

    function handleSpecUpdate(rows: ParameterRow[]) {
        if (contents_count > 0) {
            setPendingRows(rows)
            setShowConfirmDialog(true)
        } else {
            submitUpdate(rows)
        }
    }

    function submitUpdate(rows: ParameterRow[]) {
        const nextSortOrder = parameters.length
        function postNext(index: number) {
            if (index >= rows.length) {
                setViewState('default')
                return
            }
            const row = rows[index]
            router.post(
                `/spaces/${space.id}/blueprints/${blueprint.id}/parameters`,
                {
                    name: row.name,
                    label: row.name,
                    type: row.type,
                    is_required: false,
                    sort_order: nextSortOrder + index,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => postNext(index + 1),
                },
            )
        }
        postNext(0)
    }

    function handleDeleteParameter(parameterId: number) {
        router.delete(
            `/spaces/${space.id}/blueprints/${blueprint.id}/parameters/${parameterId}`,
        )
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">{blueprint.name}</h1>
                {hasParameters && viewState === 'default' && (
                    <button
                        onClick={() => setViewState('spec-edit')}
                        className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                        スペック編集
                    </button>
                )}
            </header>

            {!hasParameters && (
                <section>
                    <h2 className="text-lg font-medium mb-4">スペックを定義する</h2>
                    <SpecForm onSubmit={handleSpecCreate} submitLabel="スペック作成" />
                </section>
            )}

            {hasParameters && viewState === 'spec-edit' && (
                <section>
                    <h2 className="text-lg font-medium mb-4">スペック編集</h2>
                    <SpecEditForm
                        space={space}
                        blueprint={blueprint}
                        parameters={parameters}
                        onDelete={handleDeleteParameter}
                        onUpdate={handleSpecUpdate}
                        onCancel={() => setViewState('default')}
                    />
                </section>
            )}

            {showConfirmDialog && (
                <ConfirmDialog
                    blueprintName={blueprint.name}
                    onConfirm={() => {
                        setShowConfirmDialog(false)
                        submitUpdate(pendingRows)
                    }}
                    onCancel={() => setShowConfirmDialog(false)}
                />
            )}

            {hasParameters && viewState === 'default' && (
                <section className="mt-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">コンテンツ</h2>
                        <button
                            onClick={() => router.visit(`/spaces/${space.id}/blueprints/${blueprint.id}/contents/create`)}
                            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                        >
                            新規作成
                        </button>
                    </div>

                    {contents.length === 0 ? (
                        <div className="text-center py-8 text-[var(--color-text-muted)]">
                            コンテンツはまだありません
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {contents.map((content) => (
                                <div
                                    key={content.id}
                                    className="rounded-lg border border-[var(--color-border)] p-4 hover:border-[var(--color-text)] transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">{String(content.data.title || 'タイトルなし')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.visit(`/spaces/${space.id}/blueprints/${blueprint.id}/contents/${content.id}/edit`)}
                                                className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => router.delete(`/spaces/${space.id}/blueprints/${blueprint.id}/contents/${content.id}`)}
                                                className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

function SpecEditForm({
    space,
    blueprint,
    parameters,
    onDelete,
    onUpdate,
    onCancel,
}: {
    space: Space
    blueprint: Blueprint
    parameters: Parameter[]
    onDelete: (id: number) => void
    onUpdate: (rows: ParameterRow[]) => void
    onCancel: () => void
}) {
    return (
        <div>
            <div className="flex flex-col gap-3 mb-6">
                {parameters.map((param) => (
                    <div key={param.id} className="flex gap-2">
                        <input
                            type="text"
                            value={param.name}
                            disabled
                            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm opacity-60"
                        />
                        <select
                            value={param.type}
                            disabled
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm opacity-60"
                        >
                            <option value={param.type}>{param.type}</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => onDelete(param.id)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                        >
                            削除
                        </button>
                    </div>
                ))}
            </div>
            <SpecForm onSubmit={onUpdate} submitLabel="更新" />
            <button
                type="button"
                onClick={onCancel}
                className="mt-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]"
            >
                キャンセル
            </button>
        </div>
    )
}
