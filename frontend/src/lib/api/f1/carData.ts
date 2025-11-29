import { apiClient } from '../client';
import { CarData, CarDataParams } from '../types';

export const carData = {
    getCarData: async (params: CarDataParams): Promise<CarData[]> => {
        console.log('[CarData API] Request params:', params);
        const response = await apiClient.get<CarData[]>('/car_data', { params });
        console.log('[CarData API] Response:', response.data.length, 'records');
        return response.data;
    },
};
