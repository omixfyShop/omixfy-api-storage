import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function InputToken() {
    const [token, setToken] = useState<string>('');
    const [isVisible, setIsVisible] = useState<boolean>(false);

    // Carregar token do localStorage quando o componente monta
    useEffect(() => {
        const savedToken = localStorage.getItem('tokenAssetsme');
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    // Salvar token no localStorage quando muda
    const handleSaveToken = () => {
        if (token.trim()) {
            localStorage.setItem('tokenAssetsme', token.trim());
            alert('Token salvo com sucesso!');
        } else {
            alert('Por favor, insira um token válido.');
        }
    };

    // Remover token do localStorage
    const handleClearToken = () => {
        localStorage.removeItem('tokenAssetsme');
        setToken('');
        alert('Token removido com sucesso!');
    };

    return (
        <div className="space-y-3 border-t">
            <div className="my-4 space-y-2">
                <label
                    htmlFor="token"
                    className="text-sm font-medium text-muted-foreground pb-2"
                >
                    Token AssetsMe
                </label>
                <div className="flex items-center">
                    <Input
                        id="token"
                        type="text"
                        placeholder="Insira seu token aqui..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="flex-1 rounded-r-none"
                    />
                    <Button
                        onClick={handleSaveToken}
                        size="sm"
                        className="flex-1 rounded-l-none px-2 max-w-fit"
                        disabled={!token.trim()}
                    >
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}
