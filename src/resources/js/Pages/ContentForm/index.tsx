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

type Props = {
    parameters: Parameter[]
    values: Record<string, string>
    onChange: (name: string, value: string) => void
}

export default function ContentForm({ parameters, values, onChange }: Props) {
    return (
        <div className="flex flex-col gap-4">
            {parameters.map((parameter) => {
                switch (parameter.type) {
                    case 'string':
                    default:
                        return (
                            <div key={parameter.id} className="flex flex-col gap-1">
                                <label
                                    htmlFor={parameter.name}
                                    className="text-sm font-medium text-zinc-700"
                                >
                                    {parameter.label}
                                    {!!parameter.is_required && (
                                        <span className="ml-1 text-red-500">*</span>
                                    )}
                                </label>
                                <input
                                    id={parameter.name}
                                    type="text"
                                    name={parameter.name}
                                    value={values[parameter.name] ?? ''}
                                    required={parameter.is_required}
                                    maxLength={parameter.constraint?.max_length}
                                    onChange={(e) => onChange(parameter.name, e.target.value)}
                                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        )
                }
            })}
        </div>
    )
}
