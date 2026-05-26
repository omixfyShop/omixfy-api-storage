import { Button } from '@/components/ui/button';
import type { AccessTokenItem } from '@/types';
import { Trash2 } from 'lucide-react';
import { formatDateTime, tokenPreview } from './utils';

type TokensTableProps = {
    tokens: AccessTokenItem[];
    highlightedId: string | null;
    onDelete: (token: AccessTokenItem) => void;
};

export function TokensTable({ tokens, highlightedId, onDelete }: TokensTableProps) {
    return (
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
                                        onDelete(token)
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
    );
}
