import { Folder } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-10 text-center">
            <Folder className="h-10 w-10 text-muted-foreground" />
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {action}
        </div>
    );
}
