import { request } from '@/api/http';

export interface RegistrationSettingsResponse {
    data: {
        on: boolean;
    };
}

export async function getRegistration(): Promise<RegistrationSettingsResponse> {
    return request<RegistrationSettingsResponse>('/api/admin/settings/registration');
}

export async function updateRegistration(on: boolean): Promise<RegistrationSettingsResponse> {
    return request<RegistrationSettingsResponse>('/api/admin/settings/registration', {
        method: 'PUT',
        body: JSON.stringify({ on }),
    });
}
