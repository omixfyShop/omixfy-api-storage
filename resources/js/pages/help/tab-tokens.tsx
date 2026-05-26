import { CodeBlock } from './code-block';

export function TokensTab() {
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
