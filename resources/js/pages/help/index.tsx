import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { UploadTab } from './tab-upload';
import { AssetsTab } from './tab-assets';
import { FoldersTab } from './tab-folders';
import { TokensTab } from './tab-tokens';
import { FULL_MARKDOWN } from './full-markdown';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ajuda', href: '/help' },
];

const tabs = [
    { id: 'upload', label: 'Upload via API' },
    { id: 'assets', label: 'Acessar Assets' },
    { id: 'folders', label: 'Gerenciar Pastas' },
    { id: 'tokens', label: 'Tokens' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function CopyMarkdownButton() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(FULL_MARKDOWN);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <Button variant="outline" className="gap-2" onClick={handleCopy}>
            {copied ? (
                <>
                    <Check className="h-4 w-4" />
                    Copiado!
                </>
            ) : (
                <>
                    <FileText className="h-4 w-4" />
                    Copiar Markdown para LLM
                </>
            )}
        </Button>
    );
}

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<TabId>('upload');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajuda — API" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Documentação da API</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Exemplos de como integrar com a API de assets via código externo.
                        </p>
                    </div>
                    <CopyMarkdownButton />
                </div>

                <div className="flex gap-1 border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="max-w-4xl">
                    {activeTab === 'upload' && <UploadTab />}
                    {activeTab === 'assets' && <AssetsTab />}
                    {activeTab === 'folders' && <FoldersTab />}
                    {activeTab === 'tokens' && <TokensTab />}
                </div>
            </div>
        </AppLayout>
    );
}
