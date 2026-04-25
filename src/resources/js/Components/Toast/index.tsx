import { usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'

type PageProps = {
    flash?: {
        success?: string
    }
}

export default function Toast() {
    const { props } = usePage<PageProps>()
    const message = props.flash?.success
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (message) {
            setVisible(true)
            const timer = setTimeout(() => {
                setVisible(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [message])

    if (!visible || !message) {
        return null
    }

    return (
        <div
            role="status"
            className="fixed right-4 top-4 z-50 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-md"
        >
            {message}
        </div>
    )
}
