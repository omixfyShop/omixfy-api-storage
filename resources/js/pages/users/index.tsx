import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { CreateUserDialog } from './create-user-dialog';
import { RegistrationCard } from './registration-card';
import { TemporaryPasswordDialog } from './temporary-password-dialog';
import type { UsersPageProps } from './types';
import { useUsersPage } from './use-users-page';
import { UsersTable } from './users-table';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Usuários', href: '/admin/users' },
];

export default function UsersIndex({ users: initialUsers, registrationEnabled }: UsersPageProps) {
    const {
        sortedUsers,
        notification,
        registrationOn,
        toggleLoading,
        handleToggleRegistration,
        dialogOpen,
        handleDialogOpenChange,
        formState,
        setFormState,
        formErrors,
        formLoading,
        handleCreateUser,
        resetForm,
        temporaryPassword,
        passwordDialogOpen,
        handlePasswordDialogOpenChange,
        passwordCopied,
        handleCopyPassword,
    } = useUsersPage({ initialUsers, registrationEnabled });

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

                <RegistrationCard
                    registrationOn={registrationOn}
                    toggleLoading={toggleLoading}
                    onToggle={handleToggleRegistration}
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Usuários</CardTitle>
                            <CardDescription>Gerencie a equipe que pode acessar o AssetsMe.</CardDescription>
                        </div>
                        <CreateUserDialog
                            open={dialogOpen}
                            onOpenChange={handleDialogOpenChange}
                            formState={formState}
                            setFormState={setFormState}
                            formErrors={formErrors}
                            formLoading={formLoading}
                            onSubmit={handleCreateUser}
                            onCancel={() => {
                                handleDialogOpenChange(false);
                                resetForm();
                            }}
                        />
                    </CardHeader>
                    <CardContent>
                        <UsersTable users={sortedUsers} />
                    </CardContent>
                </Card>
            </div>

            <TemporaryPasswordDialog
                open={passwordDialogOpen}
                onOpenChange={handlePasswordDialogOpenChange}
                temporaryPassword={temporaryPassword}
                passwordCopied={passwordCopied}
                onCopy={handleCopyPassword}
            />
        </AppLayout>
    );
}
