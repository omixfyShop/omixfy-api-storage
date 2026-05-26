import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

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

export function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
    return (
        <Highlight theme={themes.oneDark} code={code.trim()} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
                <div className="relative rounded-lg border overflow-x-auto">
                    <CopyButton text={code.trim()} />
                    <pre style={style} className="p-4 pr-12 text-sm !bg-[#282c34] rounded-lg">
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                                {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                ))}
                            </div>
                        ))}
                    </pre>
                </div>
            )}
        </Highlight>
    );
}
