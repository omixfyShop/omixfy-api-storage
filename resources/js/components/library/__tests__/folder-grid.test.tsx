import { render, screen } from '@testing-library/react';
import { FolderGrid } from '../folder-grid';

describe('FolderGrid', () => {
    it('shows empty state when there are no folders', () => {
        render(
            <FolderGrid
                folders={[]}
                onSelect={() => undefined}
                emptyTitle="Sem pastas"
                emptyDescription="Crie a primeira pasta"
            />,
        );

        expect(screen.getByText('Sem pastas')).toBeInTheDocument();
        expect(screen.getByText('Crie a primeira pasta')).toBeInTheDocument();
    });
});
