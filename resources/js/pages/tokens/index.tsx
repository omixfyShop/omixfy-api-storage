import AppLayout from '@/layouts/app-layout';
import { useClipboard } from '@/hooks/use-clipboard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccessTokenItem, BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Copy, PlusCircle, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type PageProps = {
    tokens: AccessTokenItem[];
    plainToken?: string | null;
    highlightedTokenId?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Tokens', href: '/tokens' },
];

function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch (error) {
        console.error(error);
        return value;
    }
}

function tokenPreview(preview?: string | null): string {
    if (!preview) {
        return '••••';
    }

    return `•••• ${preview}`;
}

export default function TokensIndex() {
    const { tokens, plainToken, highlightedTokenId } = usePage<PageProps>().props;

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [isPlainTokenOpen, setIsPlainTokenOpen] = useState<boolean>(false);
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

    const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/tokens', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsCreateOpen(false);
            },
        });
    };

    const handleDelete = (token: AccessTokenItem) => {
        const confirmed = window.confirm('Tem certeza que deseja excluir este token?');

        if (!confirmed) {
            return;
        }

        router.delete(`/tokens/${token.id}`, {
            preserveScroll: true,
        });
    };

    const handleCopyToken = async () => {
        if (!generatedToken) {
            return;
        }

        await copyToClipboard(generatedToken);
    };

    const closeCreateDialog = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            clearErrors();
            reset();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tokens" />
            <div className="flex flex-col gap-6 p-6">
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Tokens de acesso
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Gere tokens permanentes para integrar com a API
                                de assets.
                            </p>
                        </div>

                        <Button onClick={() => setIsCreateOpen(true)}>
                            <PlusCircle className="mr-2 size-4" />
                            Criar token
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-lg border">
                        <table className="min-w-full divide-y divide-border/70 text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-foreground">
                                        Nome
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-foreground">
                                        Prévia
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-foreground">
                                        Criado em
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-foreground">
                                        Último uso
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-foreground">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70 bg-background">
                                {tokens.length === 0 && (
                                    <tr>
                                        <td
                                            className="px-4 py-6 text-center text-sm text-muted-foreground"
                                            colSpan={5}
                                        >
                                            Nenhum token cadastrado até o
                                            momento.
                                        </td>
                                    </tr>
                                )}

                                {tokens.map((token) => (
                                    <tr
                                        key={token.id}
                                        className={
                                            highlightedId === token.id
                                                ? 'bg-primary/5'
                                                : undefined
                                        }
                                    >
                                        <td className="px-4 py-3 align-middle font-medium text-foreground">
                                            {token.name?.trim() || 'Sem nome'}
                                        </td>
                                        <td className="px-4 py-3 align-middle font-mono text-sm">
                                            {tokenPreview(token.preview)}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-muted-foreground">
                                            {formatDateTime(token.created_at)}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-muted-foreground">
                                            {token.last_used_at
                                                ? formatDateTime(
                                                      token.last_used_at,
                                                  )
                                                : 'Nunca utilizado'}
                                        </td>
                                        <td className="px-4 py-3 text-right align-middle">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(token)
                                                }
                                                title="Excluir token"
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">
                                                    Excluir
                                                </span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={closeCreateDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo token</DialogTitle>
                            <DialogDescription>
                                Defina um nome para identificar o token
                                (opcional).
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            className="space-y-4"
                            onSubmit={handleCreateSubmit}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="token-name">
                                    Nome do token
                                </Label>
                                <Input
                                    id="token-name"
                                    name="name"
                                    maxLength={50}
                                    value={data.name}
                                    onChange={(event) =>
                                        setData(
                                            'name',
                                            event.currentTarget.value,
                                        )
                                    }
                                    placeholder="Ex.: Deploy pipeline"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => closeCreateDialog(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Criar token
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isPlainTokenOpen}
                    onOpenChange={setIsPlainTokenOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Token criado</DialogTitle>
                            <DialogDescription>
                                Guarde este token — ele não será exibido
                                novamente.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <code className="block rounded-md bg-muted px-3 py-2 text-sm break-all">
                                {generatedToken ?? '—'}
                            </code>

                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopyToken}
                                    className="flex-1"
                                >
                                    <Copy className="mr-2 size-4" />
                                    Copiar
                                </Button>
                                {copiedToken &&
                                    copiedToken === generatedToken && (
                                        <span className="text-sm text-green-600">
                                            Copiado!
                                        </span>
                                    )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => setIsPlainTokenOpen(false)}
                            >
                                Fechar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
