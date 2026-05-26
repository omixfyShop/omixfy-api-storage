import type { AdminUser } from '@/api/users';
import type { SharedData } from '@/types';

export interface UsersPageProps extends SharedData {
    users: AdminUser[];
    registrationEnabled: boolean;
}

export interface Notification {
    type: 'success' | 'error';
    message: string;
}
