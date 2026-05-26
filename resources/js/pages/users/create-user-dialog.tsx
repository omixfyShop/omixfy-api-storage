import type { CreateUserPayload } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formState: CreateUserPayload & { generate_password: boolean };
    setFormState: React.Dispatch<React.SetStateAction<CreateUserPayload & { generate_password: boolean }>>;
    formErrors: Record<string, string>;
    formLoading: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

export function CreateUserDialog({
    open,
    onOpenChange,
    formState,
    setFormState,
    formErrors,
    formLoading,
    onSubmit,
    onCancel,
}: CreateUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>Adicionar usuário</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo usuário</DialogTitle>
                    <DialogDescription>
                        Informe os dados básicos do usuário. A senha só será exibida uma vez quando gerada automaticamente.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="user-name">Nome</Label>
                        <Input
                            id="user-name"
                            value={formState.name}
                            autoComplete="name"
                            onChange={(event) =>
                                setFormState((current) => ({ ...current, name: event.target.value }))
                            }
                            required
                        />
                        {formErrors.name && (
                            <p className="text-sm text-destructive">{formErrors.name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-email">E-mail</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={formState.email}
                            autoComplete="email"
                            onChange={(event) =>
                                setFormState((current) => ({ ...current, email: event.target.value }))
                            }
                            required
                        />
                        {formErrors.email && (
                            <p className="text-sm text-destructive">{formErrors.email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="generate-password"
                                checked={formState.generate_password}
                                onCheckedChange={(checked) =>
                                    setFormState((current) => ({
                                        ...current,
                                        generate_password: Boolean(checked),
                                        password: checked ? '' : current.password,
                                    }))
                                }
                            />
                            <Label htmlFor="generate-password" className="cursor-pointer">
                                Gerar senha automaticamente
                            </Label>
                        </div>
                        {!formState.generate_password && (
                            <div className="space-y-2">
                                <Label htmlFor="user-password">Senha</Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={formState.password}
                                    autoComplete="new-password"
                                    onChange={(event) =>
                                        setFormState((current) => ({
                                            ...current,
                                            password: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        )}
                        {formErrors.password && (
                            <p className="text-sm text-destructive">{formErrors.password}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={formLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            {formLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
