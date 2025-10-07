import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { FolderCard } from '../folder-card';

vi.mock('@/api/library', () => ({
    fetchFolderPreview: vi.fn().mockResolvedValue({ data: [] }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithProviders(ui: ReactElement) {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('FolderCard', () => {
    it('renders folder info and fallback preview', async () => {
        const folder = {
            id: 1,
            uuid: 'uuid',
            name: 'Design',
            slug: 'design',
            parent_id: null,
            owner_id: 1,
            access_level: 'private' as const,
            depth: 0,
            files_count: 2,
            folders_count: 3,
            preview_asset_ids: [],
            breadcrumbs: [],
            created_at: '',
            updated_at: '',
            deleted_at: null,
        };

        renderWithProviders(<FolderCard folder={folder} onClick={() => undefined} />);

        expect(await screen.findByText('Design')).toBeInTheDocument();
        expect(screen.getByText(/3 pastas/)).toBeInTheDocument();
        expect(screen.getByText(/2 arquivos/)).toBeInTheDocument();
    });
});
