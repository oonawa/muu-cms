import { router, usePage } from '@inertiajs/react'
import { startTransition, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'

export default function Login() {
    const [showRecovery, setShowRecovery] = useState(false)

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold">ログイン</h1>
                </div>

                <div className="bg-[var(--color-bg-surface)] rounded-2xl p-8">
                    {showRecovery ? (
                        <RecoveryLogin
                            onBack={() => setShowRecovery(false)}
                        />
                    ) : (
                        <PasskeyLogin
                            onShowRecovery={() => setShowRecovery(true)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

function PasskeyLogin({
    onShowRecovery,
}: {
    onShowRecovery: () => void
}) {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState('')

    async function handlePasskeyLogin() {
        setIsPending(true)
        setError('')

        try {
            const optionsRes = await fetch('/passkeys/authenticate/options')
            const options = await optionsRes.json()

            const credential = await startAuthentication({ optionsJSON: options })

            const authRes = await fetch('/passkeys/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(credential),
            })

            if (!authRes.ok) {
                const data = await authRes.json()
                setError(data.message || '認証に失敗しました')
                return
            }

            router.visit('/')
        } catch (e) {
            if (e instanceof Error && e.name === 'NotAllowedError') {
                setError('認証がキャンセルされました')
            } else {
                setError('認証に失敗しました')
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center">
                パスキーで認証してください
            </p>

            {error && (
                <p className="mb-4 text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            <button
                onClick={handlePasskeyLogin}
                disabled={isPending}
                className="w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
                {isPending ? '認証中...' : 'パスキーでログイン'}
            </button>

            <button
                onClick={onShowRecovery}
                className="mt-4 w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
                メールアドレスでログイン
            </button>
        </div>
    )
}

function RecoveryLogin({ onBack }: { onBack: () => void }) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isPending, setIsPending] = useState(false)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        startTransition(() => {
            setIsPending(true)
            router.post(
                '/login',
                { email, password },
                {
                    onFinish: () => setIsPending(false),
                },
            )
        })
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                    メールアドレス
                </label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                    required
                    autoFocus
                />

                <label htmlFor="login-password" className="block text-sm font-medium mb-2 mt-4">
                    パスワード
                </label>
                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                    required
                />

                {errors.email && (
                    <p className="mt-2 text-sm text-[var(--color-error)]">
                        {errors.email}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-6 w-full rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] py-3 text-sm font-medium transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
                    style={{
                        transitionTimingFunction: 'var(--ease-spring)',
                    }}
                >
                    {isPending ? 'ログイン中...' : 'ログイン'}
                </button>
            </form>

            <button
                onClick={onBack}
                className="mt-4 w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
                パスキーでログイン
            </button>
        </div>
    )
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
}
