import { CodeBlock } from './code-block';

export function FoldersTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Listar pastas</h3>
                <CodeBlock language="javascript" code={`// Listar pastas raiz
const response = await fetch(
  'https://cdn.omixfy.com/api/v1/folders?page=1&per_page=30&orderBy=name&order=asc',
  {
    headers: { 'Authorization': 'Bearer SEU_TOKEN' },
  }
);

const { data, meta } = await response.json();`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Criar pasta</h3>
                <CodeBlock language="javascript" code={`const response = await fetch('https://cdn.omixfy.com/api/v1/folders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Nova Pasta',
    parent_id: null, // null para raiz, ou ID da pasta pai
  }),
});

const { data } = await response.json();
console.log(data.id, data.name);`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Ver conteúdo de uma pasta (subpastas + assets)</h3>
                <CodeBlock language="javascript" code={`const folderId = 349;
const response = await fetch(
  \`https://cdn.omixfy.com/api/v1/folders/\${folderId}/children?per_page=30&folders_page=1&assets_page=1\`,
  {
    headers: { 'Authorization': 'Bearer SEU_TOKEN' },
  }
);

const { folders, assets } = await response.json();
// folders: { data: [...], meta: { current_page, last_page, total, ... } }
// assets: { data: [...], meta: { current_page, last_page, total, ... } }`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Mover pasta</h3>
                <CodeBlock language="javascript" code={`const folderId = 10;
await fetch(\`https://cdn.omixfy.com/api/v1/folders/\${folderId}/move\`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parent_id: 5, // ID da nova pasta pai (null para mover para raiz)
  }),
});`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Renomear pasta</h3>
                <CodeBlock language="javascript" code={`const folderId = 10;
await fetch(\`https://cdn.omixfy.com/api/v1/folders/\${folderId}\`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Novo Nome' }),
});`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Deletar pasta</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    A exclusão é soft delete — a pasta pode ser restaurada depois.
                </p>
                <CodeBlock language="javascript" code={`const folderId = 10;

// Deletar
await fetch(\`https://cdn.omixfy.com/api/v1/folders/\${folderId}\`, {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
});

// Restaurar
await fetch(\`https://cdn.omixfy.com/api/v1/folders/\${folderId}/restore\`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
});`} />
            </div>
        </div>
    );
}
