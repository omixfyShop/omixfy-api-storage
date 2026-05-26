import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

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

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
    );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
    return (
        <div className="relative rounded-lg border bg-muted/30 p-4 font-mono text-sm overflow-x-auto">
            <CopyButton text={code} />
            <pre className="whitespace-pre-wrap break-words pr-10">{code}</pre>
        </div>
    );
}

function UploadTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Upload com cURL</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Envie um ou mais arquivos para uma pasta. O parâmetro <code>folder</code> define o caminho de destino.
                </p>
                <CodeBlock code={`curl -X POST "https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1&large=1" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -F "file=@imagem.jpg"`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Upload com JavaScript (fetch)</h3>
                <CodeBlock language="javascript" code={`const formData = new FormData();
formData.append('file', file); // File do input ou Blob

const response = await fetch(
  'https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer SEU_TOKEN',
    },
    body: formData,
  }
);

const data = await response.json();
console.log(data);
// {
//   id: "01J...",
//   path: "minha-pasta/imagem.jpg",
//   url: "https://cdn.omixfy.com/assets/minha-pasta/imagem.jpg",
//   mime: "image/jpeg",
//   size: 204800,
//   generated_thumbs: {
//     small: { url: "https://cdn.omixfy.com/assets/minha-pasta/small/imagem.jpg", path: "..." },
//     medium: { url: "https://cdn.omixfy.com/assets/minha-pasta/medium/imagem.jpg", path: "..." }
//   }
// }`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Upload com Axios (Node.js)</h3>
                <CodeBlock language="javascript" code={`import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const form = new FormData();
form.append('file', fs.createReadStream('./imagem.jpg'));

const { data } = await axios.post(
  'https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1&large=1',
  form,
  {
    headers: {
      'Authorization': 'Bearer SEU_TOKEN',
      ...form.getHeaders(),
    },
  }
);

console.log(data.url); // URL direta do asset`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Upload múltiplo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Use o campo <code>files[]</code> para enviar múltiplos arquivos de uma vez.
                </p>
                <CodeBlock code={`curl -X POST "https://cdn.omixfy.com/api/assets/upload?folder=banners" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -F "files[]=@foto1.jpg" \\
  -F "files[]=@foto2.png" \\
  -F "files[]=@foto3.webp"`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Variantes de imagem (thumbnails)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Passe os query params <code>small</code>, <code>medium</code> e/ou <code>large</code> para gerar
                    variantes automaticamente. Use <code>1</code> para o tamanho padrão ou <code>LARGURAxALTURA</code> para
                    tamanho customizado.
                </p>
                <CodeBlock code={`# Tamanhos padrão
?small=1&medium=1&large=1

# Tamanhos customizados
?small=150x150&medium=400x400&large=1200x1200`} />
            </div>
        </div>
    );
}

function AssetsTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Acessar um asset</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Todos os assets ficam disponíveis publicamente no caminho <code>/assets/</code>.
                    Não é necessário autenticação para acessar os arquivos.
                </p>
                <CodeBlock code={`https://cdn.omixfy.com/assets/{caminho-do-arquivo}

# Exemplo:
https://cdn.omixfy.com/assets/minha-pasta/imagem.jpg`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Acessar variantes (thumbnails)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    As variantes ficam em subpastas com o nome do tamanho dentro da mesma pasta do original.
                </p>
                <CodeBlock code={`# Original
https://cdn.omixfy.com/assets/produtos/foto.jpg

# Variantes
https://cdn.omixfy.com/assets/produtos/small/foto.jpg
https://cdn.omixfy.com/assets/produtos/medium/foto.jpg
https://cdn.omixfy.com/assets/produtos/large/foto.jpg`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Usar em HTML</h3>
                <CodeBlock language="html" code={`<!-- Imagem original -->
<img src="https://cdn.omixfy.com/assets/produtos/foto.jpg" alt="Produto" />

<!-- Com srcset para responsividade -->
<img
  src="https://cdn.omixfy.com/assets/produtos/medium/foto.jpg"
  srcset="
    https://cdn.omixfy.com/assets/produtos/small/foto.jpg 300w,
    https://cdn.omixfy.com/assets/produtos/medium/foto.jpg 600w,
    https://cdn.omixfy.com/assets/produtos/large/foto.jpg 1200w
  "
  sizes="(max-width: 600px) 300px, (max-width: 1024px) 600px, 1200px"
  alt="Produto"
/>`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Usar em React / Next.js</h3>
                <CodeBlock language="javascript" code={`const CDN_BASE = 'https://cdn.omixfy.com/assets';

function ProductImage({ path }) {
  return (
    <img
      src={\`\${CDN_BASE}/\${path}\`}
      alt="Produto"
      loading="lazy"
    />
  );
}

// Com variantes
function ResponsiveImage({ folder, filename }) {
  return (
    <picture>
      <source
        media="(max-width: 640px)"
        srcSet={\`\${CDN_BASE}/\${folder}/small/\${filename}\`}
      />
      <source
        media="(max-width: 1024px)"
        srcSet={\`\${CDN_BASE}/\${folder}/medium/\${filename}\`}
      />
      <img
        src={\`\${CDN_BASE}/\${folder}/large/\${filename}\`}
        alt="Produto"
        loading="lazy"
      />
    </picture>
  );
}`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Listar assets de uma pasta</h3>
                <CodeBlock language="javascript" code={`const response = await fetch(
  'https://cdn.omixfy.com/api/assets/list?folder=minha-pasta&page=1&per_page=25',
  {
    headers: { 'Authorization': 'Bearer SEU_TOKEN' },
  }
);

const { data, meta } = await response.json();
// data: array de assets com path, mime, size, url, generated_thumbs
// meta: { current_page, per_page, next_page_url, prev_page_url }`} />
            </div>
        </div>
    );
}

function FoldersTab() {
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

function TokensTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Criar um token</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Acesse a página <a href="/tokens" className="underline text-primary">Tokens</a> no menu lateral
                    para criar e gerenciar seus tokens de acesso. O token é exibido apenas uma vez no momento da criação.
                </p>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Como autenticar nas requisições</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Há 3 formas de enviar o token. Use a que for mais conveniente para o seu caso:
                </p>
                <CodeBlock code={`# 1. Header Authorization (recomendado)
curl -H "Authorization: Bearer SEU_TOKEN" https://cdn.omixfy.com/api/assets/list

# 2. Header customizado
curl -H "X-AssetsMe-Token: SEU_TOKEN" https://cdn.omixfy.com/api/assets/list

# 3. Query parameter
curl "https://cdn.omixfy.com/api/assets/list?token=SEU_TOKEN"`} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Configurar em projetos JS/Node</h3>
                <CodeBlock language="javascript" code={`// Com fetch (client ou server)
const API_BASE = 'https://cdn.omixfy.com/api';
const TOKEN = 'SEU_TOKEN'; // use variável de ambiente em produção

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(\`\${API_BASE}\${endpoint}\`, {
    ...options,
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }

  return response.json();
}`} />

                <div className="mt-4">
                    <CodeBlock language="javascript" code={`// Com Axios - criar instância configurada
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cdn.omixfy.com/api',
  headers: {
    'Authorization': \`Bearer \${process.env.OMIXFY_TOKEN}\`,
  },
});

// Usar
const { data } = await api.get('/assets/list?folder=produtos');
const upload = await api.post('/assets/upload?folder=produtos&small=1', formData);`} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Token de pasta (acesso restrito)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Tokens de pasta permitem dar acesso limitado (upload e/ou criação de subpastas)
                    a uma pasta específica, sem expor o token principal.
                </p>
                <CodeBlock language="javascript" code={`// Criar token de pasta (requer token principal)
const folderId = 349;
const response = await fetch(
  \`https://cdn.omixfy.com/api/v1/folders/\${folderId}/tokens\`,
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer SEU_TOKEN_PRINCIPAL' },
  }
);

const { data } = await response.json();
// {
//   id: 1,
//   token: "abc123...",         // usar esse token para operações na pasta
//   can_create_subfolders: true,
//   can_upload: true,
//   expires_at: null
// }`} />
            </div>
        </div>
    );
}

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<TabId>('upload');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajuda — API" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">Documentação da API</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Exemplos de como integrar com a API de assets via código externo.
                    </p>
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
