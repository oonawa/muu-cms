import { router } from '@inertiajs/react'
import { useState } from 'react'
import Toast from '../../Components/Toast'
import ContentForm from '../ContentForm'

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
    is_required: boolean
    sort_order: number
    constraint?: {
        max_length: number
    } | null
}

type Content = {
    id: number
    blueprint_id: number
    data: Record<string, string>
    created_at: string
    updated_at: string
}

type Props = {
    space: Space
    blueprint: Blueprint
    parameters: Parameter[]
    content: Content
}

export default function ContentEdit({ space, blueprint, parameters, content }: Props) {
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {}
        for (const p of parameters) {
            init[p.name] = (content.data[p.name] as string) ?? ''
        }
        return init
    })

    function handleChange(name: string, value: string) {
        setValues((prev) => ({ ...prev, [name]: value }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        router.put(
            `/spaces/${space.id}/blueprints/${blueprint.id}/contents/${content.id}`,
            values,
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-8">
            <Toast />
            <div className="mx-auto max-w-xl">
                <h1 className="mb-6 text-xl font-semibold text-zinc-900">
                    {blueprint.name} — コンテンツ編集
                </h1>
                <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <ContentForm
                        parameters={parameters}
                        values={values}
                        onChange={handleChange}
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(`/spaces/${space.id}/blueprints/${blueprint.id}`)}
                            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
                        >
                            保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
