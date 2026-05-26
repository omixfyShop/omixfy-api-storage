import type { AdminUser } from '@/api/users';
import { formatDate } from './format-date';

interface UsersTableProps {
    users: AdminUser[];
}

export function UsersTable({ users }: UsersTableProps) {
    return (
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
                    {users.map((user) => (
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
                    {users.length === 0 && (
                        <tr>
                            <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                                Nenhum usuário cadastrado até o momento.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
