import { useClipboard } from '@/hooks/use-clipboard';
import type { AccessTokenItem } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import type { PageProps } from './types';

export function useTokenForm() {
    const { tokens, plainToken, highlightedTokenId } = usePage<PageProps>().props;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPlainTokenOpen, setIsPlainTokenOpen] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<string | null>(plainToken ?? null);
    const [copiedToken, copyToClipboard] = useClipboard();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
    });

    useEffect(() => {
        if (plainToken) {
            setGeneratedToken(plainToken);
            setIsPlainTokenOpen(true);
        }
    }, [plainToken]);

    const highlightedId = highlightedTokenId ?? null;

    function handleCreateSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        post('/tokens', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsCreateOpen(false);
            },
        });
    }

    function handleDelete(token: AccessTokenItem): void {
        const confirmed = window.confirm('Tem certeza que deseja excluir este token?');

        if (!confirmed) {
            return;
        }

        router.delete(`/tokens/${token.id}`, {
            preserveScroll: true,
        });
    }

    async function handleCopyToken(): Promise<void> {
        if (!generatedToken) {
            return;
        }

        await copyToClipboard(generatedToken);
    }

    function closeCreateDialog(open: boolean): void {
        setIsCreateOpen(open);
        if (!open) {
            clearErrors();
            reset();
        }
    }

    return {
        tokens,
        highlightedId,
        isCreateOpen,
        isPlainTokenOpen,
        setIsPlainTokenOpen,
        generatedToken,
        copiedToken,
        data,
        setData,
        processing,
        errors,
        handleCreateSubmit,
        handleDelete,
        handleCopyToken,
        closeCreateDialog,
    };
}
