import { router, usePage } from '@inertiajs/react'
import {
    startTransition,
    useOptimistic,
    useRef,
    useState,
} from 'react'

type Blueprint = {
    id: number
    slug: string
    name: string
    type: 'single' | 'multiple'
}

type Space = {
    id: number
    name: string
}

type OptimisticAction =
    | { type: 'add'; blueprint: Blueprint }
    | { type: 'update'; id: number; name: string }
    | { type: 'remove'; id: number }

export default function SpacePage() {
    const { space, blueprints, errors } = usePage<{
        space: Space
        blueprints: Blueprint[]
        errors: Record<string, string>
    }>().props

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Blueprint | null>(null)

    const [optimisticBlueprints, addOptimistic] = useOptimistic(
        blueprints,
        (state: Blueprint[], action: OptimisticAction) => {
            switch (action.type) {
                case 'add':
                    return [...state, action.blueprint]
                case 'update':
                    return state.map((b) =>
                        b.id === action.id ? { ...b, name: action.name } : b,
                    )
                case 'remove':
                    return state.filter((b) => b.id !== action.id)
            }
        },
    )

    function handleCreate(slug: string, name: string, type: 'single' | 'multiple') {
        startTransition(() => {
            addOptimistic({
                type: 'add',
                blueprint: { id: Date.now(), slug, name, type },
            })
            router.post(
                `/spaces/${space.id}/blueprints`,
                { slug, name, type },
                { onSuccess: () => setShowCreateModal(false) },
            )
        })
    }

    function handleUpdate(id: number, name: string) {
        startTransition(() => {
            addOptimistic({ type: 'update', id, name })
            router.put(
                `/spaces/${space.id}/blueprints/${id}`,
                { name },
                { onSuccess: () => setEditingId(null) },
            )
        })
    }

    function handleDelete(blueprint: Blueprint) {
        startTransition(() => {
            addOptimistic({ type: 'remove', id: blueprint.id })
            router.delete(`/spaces/${space.id}/blueprints/${blueprint.id}`, {
                onSuccess: () => setDeleteTarget(null),
            })
        })
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">{space.name}</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                    style={{ transitionTimingFunction: 'var(--ease-spring)' }}
                >
                    新規作成
                </button>
            </header>

            {optimisticBlueprints.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-[var(--color-text-muted)]">モノがありません</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 text-sm text-[var(--color-interactive)] hover:underline"
                    >
                        最初のモノを作成する
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {optimisticBlueprints.map((blueprint) => (
                        <BlueprintCard
                            key={blueprint.id}
                            blueprint={blueprint}
                            isEditing={editingId === blueprint.id}
                            onEdit={() => setEditingId(blueprint.id)}
                            onCancelEdit={() => setEditingId(null)}
                            onUpdate={(name) => handleUpdate(blueprint.id, name)}
                            onDelete={() => setDeleteTarget(blueprint)}
                            onNavigate={() =>
                                router.visit(
                                    `/spaces/${space.id}/blueprints/${blueprint.id}`,
                                )
                            }
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
                    blueprint={deleteTarget}
                    onConfirm={() => handleDelete(deleteTarget)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    )
}

function BlueprintCard({
    blueprint,
    isEditing,
    onEdit,
    onCancelEdit,
    onUpdate,
    onDelete,
    onNavigate,
}: {
    blueprint: Blueprint
    isEditing: boolean
    onEdit: () => void
    onCancelEdit: () => void
    onUpdate: (name: string) => void
    onDelete: () => void
    onNavigate: () => void
}) {
    const [editName, setEditName] = useState(blueprint.name)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleEditStart() {
        setEditName(blueprint.name)
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
            onClick={onNavigate}
        >
            <span className="font-medium">{blueprint.name}</span>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
    onSubmit: (slug: string, name: string, type: 'single' | 'multiple') => void
    onClose: () => void
}) {
    const [step, setStep] = useState<'type' | 'detail'>('type')
    const [selectedType, setSelectedType] = useState<'single' | 'multiple' | null>(null)
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (name.trim() && slug.trim() && selectedType) {
            onSubmit(slug.trim(), name.trim(), selectedType)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-lg animate-[modal-in_0.4s_var(--ease-spring)]"
                onClick={(e) => e.stopPropagation()}
            >
                {step === 'type' ? (
                    <>
                        <h2 className="text-lg font-medium mb-6">
                            モノのタイプを選んでください
                        </h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <label
                                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                    selectedType === 'single'
                                        ? 'border-[var(--color-interactive)]'
                                        : 'border-[var(--color-border)]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value="single"
                                    checked={selectedType === 'single'}
                                    onChange={() => setSelectedType('single')}
                                    className="absolute top-3 left-3"
                                    aria-label="ひとつ"
                                />
                                <span className="font-medium mt-6 mb-2">ひとつ</span>
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    一つだけ登録するデータです。1ページのみで使う情報や、個人サイトの自己紹介などにおすすめです。
                                </span>
                            </label>
                            <label
                                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                    selectedType === 'multiple'
                                        ? 'border-[var(--color-interactive)]'
                                        : 'border-[var(--color-border)]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value="multiple"
                                    checked={selectedType === 'multiple'}
                                    onChange={() => setSelectedType('multiple')}
                                    className="absolute top-3 left-3"
                                    aria-label="たくさん"
                                />
                                <span className="font-medium mt-6 mb-2">たくさん</span>
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    同じ構成のデータを2つ以上作成します。ブログ記事、お知らせなどにおすすめです。
                                </span>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('detail')}
                                disabled={selectedType === null}
                                className="flex-1 rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                次へ
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-[var(--color-border)] py-3 text-sm text-[var(--color-text-muted)]"
                            >
                                キャンセル
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-lg font-medium mb-4">モノを作成</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)] mb-3"
                                placeholder="モノの名前"
                                required
                                autoFocus
                            />
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                                placeholder="slug"
                                required
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-[var(--color-error)]">
                                    {errors.name}
                                </p>
                            )}
                            {errors.slug && (
                                <p className="mt-2 text-sm text-[var(--color-error)]">
                                    {errors.slug}
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
                    </>
                )}
            </div>
        </div>
    )
}

function DeleteConfirm({
    blueprint,
    onConfirm,
    onCancel,
}: {
    blueprint: Blueprint
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
                <h2 className="text-lg font-medium mb-2">モノを削除</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                    「{blueprint.name}
                    」を削除します。配下のコンテンツもすべて削除されます。この操作は取り消せません。
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
