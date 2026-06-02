import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { breadcrumbs } from './constants';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CreateTokenDialog } from './create-token-dialog';
import { PlainTokenDialog } from './plain-token-dialog';
import { TokensTable } from './tokens-table';
import { useTokenForm } from './use-token-form';

export default function TokensIndex() {
    const {
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
        tokenToDelete,
        isDeleting,
        confirmDelete,
        closeDeleteDialog,
    } = useTokenForm();

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

                        <Button onClick={() => closeCreateDialog(true)}>
                            <PlusCircle className="mr-2 size-4" />
                            Criar token
                        </Button>
                    </div>

                    <TokensTable
                        tokens={tokens}
                        highlightedId={highlightedId}
                        onDelete={handleDelete}
                    />
                </div>

                <CreateTokenDialog
                    open={isCreateOpen}
                    onOpenChange={closeCreateDialog}
                    name={data.name}
                    onNameChange={(value) => setData('name', value)}
                    processing={processing}
                    error={errors.name}
                    onSubmit={handleCreateSubmit}
                />

                <PlainTokenDialog
                    open={isPlainTokenOpen}
                    onOpenChange={setIsPlainTokenOpen}
                    generatedToken={generatedToken}
                    copiedToken={copiedToken}
                    onCopy={handleCopyToken}
                />

                <ConfirmDialog
                    open={tokenToDelete !== null}
                    onOpenChange={closeDeleteDialog}
                    title="Excluir token"
                    description="Tem certeza que deseja excluir este token? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    pendingLabel="Excluindo…"
                    destructive
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </AppLayout>
    );
}
