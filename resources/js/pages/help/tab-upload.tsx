import { CodeBlock } from './code-block';

export function UploadTab() {
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
