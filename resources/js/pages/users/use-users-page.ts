import { create, CreateUserPayload, extractErrorMessage, type AdminUser } from '@/api/users';
import { HttpError } from '@/api/http';
import { updateRegistration } from '@/api/settings';
import { useCallback, useMemo, useState } from 'react';
import type { Notification } from './types';

interface UseUsersPageParams {
    initialUsers: AdminUser[];
    registrationEnabled: boolean;
}

export function useUsersPage({ initialUsers, registrationEnabled }: UseUsersPageParams) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [registrationOn, setRegistrationOn] = useState<boolean>(registrationEnabled);
    const [toggleLoading, setToggleLoading] = useState<boolean>(false);
    const [notification, setNotification] = useState<Notification | null>(null);

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

    const handleDialogOpenChange = useCallback(
        (open: boolean) => {
            setDialogOpen(open);
            if (!open) {
                resetForm();
            }
        },
        [resetForm],
    );

    const handlePasswordDialogOpenChange = useCallback((open: boolean) => {
        setPasswordDialogOpen(open);
        if (!open) {
            setPasswordCopied(false);
        }
    }, []);

    return {
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
    };
}
