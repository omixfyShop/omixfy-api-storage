import { CodeBlock } from './code-block';

export function AssetsTab() {
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
