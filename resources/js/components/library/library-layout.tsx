import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { Plus, Search, SortAsc, SortDesc } from 'lucide-react';
import { type PropsWithChildren, type ReactNode } from 'react';

interface LibraryLayoutProps extends PropsWithChildren {
    breadcrumbs: BreadcrumbItem[];
    title: string;
    onCreateFolder?: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    orderBy: 'name' | 'created_at' | 'updated_at';
    order: 'asc' | 'desc';
    onOrderByChange: (value: 'name' | 'created_at' | 'updated_at') => void;
    onOrderChange: (value: 'asc' | 'desc') => void;
    actionSlot?: ReactNode;
}

export function LibraryLayout({
    breadcrumbs,
    title,
    children,
    onCreateFolder,
    search,
    onSearchChange,
    orderBy,
    order,
    onOrderByChange,
    onOrderChange,
    actionSlot,
}: LibraryLayoutProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{breadcrumbs.map((crumb) => crumb.title).join(' / ')}</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {actionSlot}
                    {onCreateFolder ? (
                        <Button onClick={onCreateFolder} className="gap-2">
                            <Plus className="h-4 w-4" /> Nova pasta
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm sm:grid-cols-3">
                <label className="col-span-2 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Buscar pastas"
                        className="h-8 border-none p-0 shadow-none focus-visible:ring-0"
                    />
                </label>
                <div className="flex items-center justify-end gap-2">
                    <div className="hidden sm:block">
                        <Label htmlFor="orderBy" className="text-xs uppercase text-muted-foreground">
                            Ordenar por
                        </Label>
                        <Select value={orderBy} onValueChange={(value) => onOrderByChange(value as typeof orderBy)}>
                            <SelectTrigger id="orderBy" className="h-8 w-[160px]">
                                <SelectValue placeholder="Ordenar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="created_at">Criado em</SelectItem>
                                <SelectItem value="updated_at">Atualizado em</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
                        aria-label={order === 'asc' ? 'Ordenar crescente' : 'Ordenar decrescente'}
                    >
                        {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {children}
        </div>
    );
}
