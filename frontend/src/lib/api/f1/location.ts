import { apiClient } from '../client';
import { Location, LocationParams } from '../types';

export const location = {
    getLocation: async (params: LocationParams): Promise<Location[]> => {
        const response = await apiClient.get<Location[]>('/location', { params });
        return response.data;
    },
};
