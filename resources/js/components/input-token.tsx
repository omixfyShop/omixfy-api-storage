import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function InputToken() {
    const { toast } = useToast();
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        const savedToken = localStorage.getItem('tokenAssetsme');
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    const handleSaveToken = () => {
        if (token.trim()) {
            localStorage.setItem('tokenAssetsme', token.trim());
            toast({
                title: 'Token salvo com sucesso!',
                variant: 'success',
            });
        } else {
            toast({
                title: 'Por favor, insira um token válido.',
                variant: 'destructive',
            });
        }
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
