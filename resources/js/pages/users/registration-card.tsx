import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RegistrationCardProps {
    registrationOn: boolean;
    toggleLoading: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RegistrationCard({ registrationOn, toggleLoading, onToggle }: RegistrationCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cadastro público</CardTitle>
                <CardDescription>
                    Controle se novos usuários podem se registrar sem convite.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Quando desabilitado, somente o usuário master pode criar novas contas.
                    </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                        type="checkbox"
                        role="switch"
                        className={cn(
                            'h-6 w-11 appearance-none rounded-full border border-transparent transition',
                            registrationOn ? 'bg-primary' : 'bg-muted',
                            toggleLoading ? 'opacity-70' : '',
                        )}
                        onChange={onToggle}
                        checked={registrationOn}
                        disabled={toggleLoading}
                    />
                    <span>{registrationOn ? 'Cadastro habilitado' : 'Cadastro desabilitado'}</span>
                </label>
            </CardContent>
        </Card>
    );
}
