import { router, usePage } from '@inertiajs/react'
import {
    startTransition,
    useOptimistic,
    useRef,
    useState,
} from 'react'

type Space = {
    id: number
    name: string
    created_at: string
}

type OptimisticAction =
    | { type: 'add'; space: Space }
    | { type: 'update'; id: number; name: string }
    | { type: 'remove'; id: number }

export default function Dashboard() {
    const { spaces } = usePage<{ spaces: Space[] }>().props
    const { errors } = usePage<{ errors: Record<string, string> }>().props
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Space | null>(null)

    const [optimisticSpaces, addOptimistic] = useOptimistic(
        spaces,
        (state: Space[], action: OptimisticAction) => {
            switch (action.type) {
                case 'add':
                    return [...state, action.space]
                case 'update':
                    return state.map((s) =>
                        s.id === action.id ? { ...s, name: action.name } : s,
                    )
                case 'remove':
                    return state.filter((s) => s.id !== action.id)
            }
        },
    )

    function handleCreate(name: string) {
        startTransition(() => {
            addOptimistic({
                type: 'add',
                space: { id: Date.now(), name, created_at: '' },
            })
            router.post('/spaces', { name }, {
                onSuccess: () => setShowCreateModal(false),
            })
        })
    }

    function handleUpdate(id: number, name: string) {
        startTransition(() => {
            addOptimistic({ type: 'update', id, name })
            router.put(`/spaces/${id}`, { name }, {
                onSuccess: () => setEditingId(null),
            })
        })
    }

    function handleDelete(space: Space) {
        startTransition(() => {
            addOptimistic({ type: 'remove', id: space.id })
            router.delete(`/spaces/${space.id}`, {
                onSuccess: () => setDeleteTarget(null),
            })
        })
    }

    function handleLogout() {
        router.post('/logout')
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">ハコ一覧</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                        style={{
                            transitionTimingFunction: 'var(--ease-spring)',
                        }}
                    >
                        新規作成
                    </button>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-opacity duration-300 hover:opacity-80"
                    >
                        ログアウト
                    </button>
                </div>
            </header>

            {optimisticSpaces.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-[var(--color-text-muted)]">
                        ハコがありません
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 text-sm text-[var(--color-interactive)] hover:underline"
                    >
                        最初のハコを作成する
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {optimisticSpaces.map((space) => (
                        <SpaceCard
                            key={space.id}
                            space={space}
                            isEditing={editingId === space.id}
                            onEdit={() => setEditingId(space.id)}
                            onCancelEdit={() => setEditingId(null)}
                            onUpdate={(name) => handleUpdate(space.id, name)}
                            onDelete={() => setDeleteTarget(space)}
                        />
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateModal
                    errors={errors}
                    onSubmit={handleCreate}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {deleteTarget && (
                <DeleteConfirm
                    space={deleteTarget}
                    onConfirm={() => handleDelete(deleteTarget)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    )
}

function SpaceCard({
    space,
    isEditing,
    onEdit,
    onCancelEdit,
    onUpdate,
    onDelete,
}: {
    space: Space
    isEditing: boolean
    onEdit: () => void
    onCancelEdit: () => void
    onUpdate: (name: string) => void
    onDelete: () => void
}) {
    const [editName, setEditName] = useState(space.name)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleEditStart() {
        setEditName(space.name)
        onEdit()
        requestAnimationFrame(() => inputRef.current?.focus())
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (editName.trim()) {
            onUpdate(editName.trim())
        }
    }

    if (isEditing) {
        return (
            <div className="bg-[var(--color-bg-surface)] rounded-xl p-4">
                <form onSubmit={handleEditSubmit} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onCancelEdit()
                        }}
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] px-3 py-2 text-sm"
                    >
                        保存
                    </button>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)]"
                    >
                        取消
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div
            className="bg-[var(--color-bg-surface)] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
            style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            onClick={() => router.visit(`/spaces/${space.id}`)}
        >
            <span className="font-medium">{space.name}</span>
            <div
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleEditStart}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    名前変更
                </button>
                <button
                    onClick={onDelete}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                >
                    削除
                </button>
            </div>
        </div>
    )
}

function CreateModal({
    errors,
    onSubmit,
    onClose,
}: {
    errors: Record<string, string>
    onSubmit: (name: string) => void
    onClose: () => void
}) {
    const [name, setName] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (name.trim()) {
            onSubmit(name.trim())
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-sm animate-[modal-in_0.4s_var(--ease-spring)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-medium mb-4">ハコを作成</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                        placeholder="ハコの名前"
                        required
                        autoFocus
                    />
                    {errors.name && (
                        <p className="mt-2 text-sm text-[var(--color-error)]">
                            {errors.name}
                        </p>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                        >
                            作成
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-[var(--color-border)] py-3 text-sm text-[var(--color-text-muted)]"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DeleteConfirm({
    space,
    onConfirm,
    onCancel,
}: {
    space: Space
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            onClick={onCancel}
        >
            <div
                className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-sm animate-[modal-in_0.4s_var(--ease-spring)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-medium mb-2">ハコを削除</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                    「{space.name}
                    」を削除します。配下のモノ・コンテンツもすべて削除されます。この操作は取り消せません。
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-[var(--color-error)] text-white py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                    >
                        削除する
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
