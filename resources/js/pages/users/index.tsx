import { create, CreateUserPayload, extractErrorMessage, type AdminUser } from '@/api/users';
import { HttpError } from '@/api/http';
import { updateRegistration } from '@/api/settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface UsersPageProps extends SharedData {
    users: AdminUser[];
    registrationEnabled: boolean;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Usuários', href: '/admin/users' },
];

function formatDate(date: string | null | undefined): string {
    if (!date) {
        return '—';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleString('pt-BR');
}

export default function UsersIndex({ users: initialUsers, registrationEnabled }: UsersPageProps) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [registrationOn, setRegistrationOn] = useState<boolean>(registrationEnabled);
    const [toggleLoading, setToggleLoading] = useState<boolean>(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
    const [formState, setFormState] = useState<CreateUserPayload & { generate_password: boolean }>(
        () => ({ name: '', email: '', password: '', generate_password: true }),
    );
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [passwordCopied, setPasswordCopied] = useState<boolean>(false);

    const sortedUsers = useMemo(
        () =>
            [...users].sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }),
        [users],
    );

    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        window.setTimeout(() => {
            setNotification((current) => (current?.message === message ? null : current));
        }, 5000);
    }, []);

    const handleToggleRegistration = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const desiredState = event.target.checked;
            const previousState = registrationOn;
            setToggleLoading(true);
            setNotification(null);
            setRegistrationOn(desiredState);

            try {
                const response = await updateRegistration(desiredState);
                setRegistrationOn(response.data.on);
                showNotification('success', response.data.on ? 'Cadastro público habilitado.' : 'Cadastro público desabilitado.');
            } catch (error) {
                setRegistrationOn(previousState);
                const message =
                    error instanceof HttpError
                        ? extractErrorMessage(error.payload, 'Não foi possível atualizar a configuração.')
                        : 'Não foi possível atualizar a configuração.';
                showNotification('error', message);
            } finally {
                setToggleLoading(false);
            }
        },
        [registrationOn, showNotification],
    );

    const resetForm = useCallback(() => {
        setFormState({ name: '', email: '', password: '', generate_password: true });
        setFormErrors({});
        setPasswordCopied(false);
    }, []);

    const handleCreateUser = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setFormLoading(true);
            setFormErrors({});
            setNotification(null);

            const payload: CreateUserPayload = {
                name: formState.name.trim(),
                email: formState.email.trim(),
                generate_password: formState.generate_password,
            };

            if (!formState.generate_password) {
                payload.password = formState.password;
            }

            try {
                const response = await create(payload);
                setUsers((current) => [response.data, ...current]);
                setDialogOpen(false);
                resetForm();
                showNotification('success', 'Usuário criado com sucesso.');

                if (response.temporary_password) {
                    setTemporaryPassword(response.temporary_password);
                    setPasswordDialogOpen(true);
                } else {
                    setTemporaryPassword(null);
                }
            } catch (error) {
                if (error instanceof HttpError) {
                    const payloadErrors =
                        error.payload && typeof error.payload === 'object'
                            ? (error.payload as { errors?: Record<string, string[]> }).errors ?? {}
                            : {};

                    const formattedErrors: Record<string, string> = {};
                    Object.entries(payloadErrors).forEach(([key, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            formattedErrors[key] = messages[0];
                        }
                    });

                    setFormErrors(formattedErrors);
                    const message = extractErrorMessage(error.payload, 'Não foi possível criar o usuário.');
                    showNotification('error', message);
                } else {
                    showNotification('error', 'Não foi possível criar o usuário.');
                }
            } finally {
                setFormLoading(false);
            }
        },
        [formState, resetForm, showNotification],
    );

    const handleCopyPassword = useCallback(async () => {
        if (!temporaryPassword) {
            return;
        }

        try {
            await navigator.clipboard.writeText(temporaryPassword);
            setPasswordCopied(true);
        } catch (error) {
            console.error(error);
        }
    }, [temporaryPassword]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />

            <div className="space-y-6">
                {notification && (
                    <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
                        <AlertTitle>{notification.type === 'error' ? 'Erro' : 'Sucesso'}</AlertTitle>
                        <AlertDescription>{notification.message}</AlertDescription>
                    </Alert>
                )}

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
                                onChange={handleToggleRegistration}
                                checked={registrationOn}
                                disabled={toggleLoading}
                            />
                            <span>{registrationOn ? 'Cadastro habilitado' : 'Cadastro desabilitado'}</span>
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Usuários</CardTitle>
                            <CardDescription>Gerencie a equipe que pode acessar o AssetsMe.</CardDescription>
                        </div>
                        <Dialog
                            open={dialogOpen}
                            onOpenChange={(open) => {
                                setDialogOpen(open);
                                if (!open) {
                                    resetForm();
                                }
                            }}
                        >
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
                                <form className="space-y-4" onSubmit={handleCreateUser}>
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
                                            onClick={() => {
                                                setDialogOpen(false);
                                                resetForm();
                                            }}
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
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr className="text-left text-sm text-muted-foreground">
                                        <th className="px-4 py-3 font-medium">Nome</th>
                                        <th className="px-4 py-3 font-medium">E-mail</th>
                                        <th className="px-4 py-3 font-medium">Criado em</th>
                                        <th className="px-4 py-3 font-medium">Master</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm">
                                    {sortedUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-3 font-medium">{user.name}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                                            <td className="px-4 py-3">
                                                {user.is_master ? (
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                                        Master
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedUsers.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                                                Nenhum usuário cadastrado até o momento.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={passwordDialogOpen}
                onOpenChange={(open) => {
                    setPasswordDialogOpen(open);
                    if (!open) {
                        setPasswordCopied(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Senha gerada automaticamente</DialogTitle>
                        <DialogDescription>
                            Copie e compartilhe esta senha com o usuário. Ela não será exibida novamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-center">
                        <code className="text-lg font-semibold tracking-wide">{temporaryPassword}</code>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                            Fechar
                        </Button>
                        <Button type="button" onClick={handleCopyPassword}>
                            {passwordCopied ? 'Copiado!' : 'Copiar senha'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
