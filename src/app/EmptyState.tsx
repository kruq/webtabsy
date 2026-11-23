import React from 'react';

interface EmptyStateProps {
    title: string;
    /** Opcjonalna podpowiedź pod tytułem, np. gdzie dodać brakujące dane. */
    hint?: string;
}

/** Szary, wyśrodkowany komunikat o braku danych (np. „Brak recept”, „Brak leków”). */
export default function EmptyState({ title, hint }: EmptyStateProps) {
    return (
        <div className="mt-5 text-center text-secondary">
            <div>{title}</div>
            {hint && <div>{hint}</div>}
        </div>
    );
}
