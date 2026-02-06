export interface VariableLocationResponseDto {
    variableId: string;
    variableCode: string;
    variableName: string;
    locations: Array<{
        id: string;
        communeId: string;
        communeCode: string;
        communeName: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    }>;
}

export interface VariableAdvanceWithLocationDto {
    id: string;
    year: number;
    month: number;
    value: number;
    observations?: string;
    createAt: Date;
    variable: {
        id: string;
        code: string;
        name: string;
    };
    locations: Array<{
        id: string;
        communeId: string;
        communeCode: string;
        communeName: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    }>;
}

export interface VariableAdvancesWithLocationsResponseDto {
    advances: VariableAdvanceWithLocationDto[];
    variableLocations: Array<{
        id: string;
        communeId: string;
        communeCode: string;
        communeName: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    }>;
}
