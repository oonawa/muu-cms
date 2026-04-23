import { router, usePage } from '@inertiajs/react'
import { startTransition, useEffect, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'

type Step = 'name' | 'passkey' | 'recovery' | 'complete'

export default function Setup() {
    const { step: serverStep } = usePage<{ step?: Step }>().props
    const [step, setStep] = useState<Step>(serverStep || 'name')
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (serverStep) setStep(serverStep)
    }, [serverStep])

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold">セットアップ</h1>
                    <p className="mt-2 text-[var(--color-text-muted)] text-sm">
                        管理者アカウントを作成します
                    </p>
                    <StepIndicator current={step} />
                </div>

                <div className="bg-[var(--color-bg-surface)] rounded-2xl p-8">
                    {step === 'name' && (
                        <NameStep isPending={isPending} setIsPending={setIsPending} />
                    )}
                    {step === 'passkey' && (
                        <PasskeyStep
                            isPending={isPending}
                            setIsPending={setIsPending}
                            error={error}
                            setError={setError}
                            onNext={() => setStep('recovery')}
                        />
                    )}
                    {step === 'recovery' && (
                        <RecoveryStep isPending={isPending} setIsPending={setIsPending} onSkip={() => setStep('complete')} />
                    )}
                    {step === 'complete' && <CompleteStep />}
                </div>
            </div>
        </div>
    )
}

function StepIndicator({ current }: { current: Step }) {
    const steps: Step[] = ['name', 'passkey', 'recovery', 'complete']
    const currentIndex = steps.indexOf(current)

    return (
        <div className="flex justify-center gap-2 mt-4">
            {steps.map((s, i) => (
                <div
                    key={s}
                    className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${
                        i <= currentIndex
                            ? 'bg-[var(--color-text)]'
                            : 'bg-[var(--color-border)]'
                    }`}
                    style={{ transitionTimingFunction: 'var(--ease-spring)' }}
                />
            ))}
        </div>
    )
}

function NameStep({
    isPending,
    setIsPending,
}: {
    isPending: boolean
    setIsPending: (v: boolean) => void
}) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props
    const [name, setName] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        startTransition(() => {
            setIsPending(true)
            router.post('/setup/user', { name }, {
                onFinish: () => setIsPending(false),
            })
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium mb-2">
                ユーザー名
            </label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                placeholder="管理者の名前を入力"
                required
                autoFocus
            />
            {errors.name && (
                <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.name}
                </p>
            )}
            <button
                type="submit"
                disabled={isPending}
                className="mt-6 w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
                {isPending ? '作成中...' : '次へ'}
            </button>
        </form>
    )
}

function PasskeyStep({
    isPending,
    setIsPending,
    error,
    setError,
    onNext,
}: {
    isPending: boolean
    setIsPending: (v: boolean) => void
    error: string
    setError: (v: string) => void
    onNext: () => void
}) {
    async function handleRegister() {
        setIsPending(true)
        setError('')

        try {
            const optionsRes = await fetch('/passkeys/register/options')
            const options = await optionsRes.json()

            const credential = await startRegistration({ optionsJSON: options })

            const registerRes = await fetch('/passkeys/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(credential),
            })

            if (!registerRes.ok) {
                const data = await registerRes.json()
                setError(data.message || 'パスキーの登録に失敗しました')
                return
            }

            onNext()
        } catch (e) {
            if (e instanceof Error && e.name === 'NotAllowedError') {
                setError('パスキーの登録がキャンセルされました')
            } else {
                setError('パスキーの登録に失敗しました')
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div>
            <h2 className="text-lg font-medium mb-2">パスキーを登録</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
                パスキーを使うと、指紋認証や顔認証でログインできます。
            </p>

            {error && (
                <p className="mb-4 text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            <button
                onClick={handleRegister}
                disabled={isPending}
                className="w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
                {isPending ? '登録中...' : 'パスキーを登録する'}
            </button>
        </div>
    )
}

function RecoveryStep({
    isPending,
    setIsPending,
    onSkip,
}: {
    isPending: boolean
    setIsPending: (v: boolean) => void
    onSkip: () => void
}) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        startTransition(() => {
            setIsPending(true)
            router.post('/setup/recovery', {
                email,
                password,
                password_confirmation: passwordConfirmation,
            }, {
                onFinish: () => setIsPending(false),
            })
        })
    }

    function handleSkip() {
        onSkip()
    }

    return (
        <div>
            <h2 className="text-lg font-medium mb-2">リカバリ情報</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
                パスキーを紛失した場合のログイン手段です。登録は任意です。
            </p>

            <div className="mb-6 rounded-lg bg-[var(--color-warning)]/10 px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-warning)]">
                    パスワードに関する注意事項
                </p>
                <ul className="mt-2 text-sm text-[var(--color-text-muted)] list-disc list-inside space-y-1">
                    <li>人間が推測・記憶できないパスワードを設定してください</li>
                    <li>
                        Apple パスワードアプリや Chrome
                        パスワードマネージャなど、専用ツールで管理してください
                    </li>
                </ul>
            </div>

            <form onSubmit={handleSubmit}>
                <label htmlFor="recovery-email" className="block text-sm font-medium mb-2">
                    メールアドレス
                </label>
                <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                    placeholder="admin@example.com"
                    required
                />
                {errors.email && (
                    <p className="mt-2 text-sm text-[var(--color-error)]">
                        {errors.email}
                    </p>
                )}

                <label htmlFor="recovery-password" className="block text-sm font-medium mb-2 mt-4">
                    パスワード
                </label>
                <input
                    id="recovery-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                    required
                />
                {errors.password && (
                    <p className="mt-2 text-sm text-[var(--color-error)]">
                        {errors.password}
                    </p>
                )}

                <label htmlFor="recovery-password-confirm" className="block text-sm font-medium mb-2 mt-4">
                    パスワード（確認）
                </label>
                <input
                    id="recovery-password-confirm"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                    required
                />

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-6 w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
                    style={{
                        transitionTimingFunction: 'var(--ease-spring)',
                    }}
                >
                    {isPending ? '登録中...' : '登録する'}
                </button>
            </form>

            <button
                onClick={handleSkip}
                disabled={isPending}
                className="mt-3 w-full rounded-lg border border-[var(--color-border)] bg-transparent py-3 text-sm text-[var(--color-text-muted)] transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
            >
                スキップ
            </button>
        </div>
    )
}

function CompleteStep() {
    function handleStart() {
        startTransition(() => {
            router.post('/setup/complete', {})
        })
    }

    return (
        <div className="text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-lg font-medium mb-2">セットアップ完了</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
                管理画面を使い始めましょう。
            </p>
            <button
                onClick={handleStart}
                className="w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80"
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
                はじめる
            </button>
        </div>
    )
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
}
