export class IndicatorGoalDto {
    id!: string;
    year!: number;
    value!: number;
}

export class IndicatorAdvanceDto {
    id!: string;
    year!: number;
    month!: number | null;
    value!: number;
    accumulatedValue!: number | null;
    observations?: string | null;
    evidenceUrl?: string | null;
}

export class VariableGoalDto {
    id!: string;
    year!: number;
    value!: number;
}

export class VariableAdvanceDto {
    id!: string;
    year!: number;
    month!: number;
    value!: number;
    observations?: string;
}

export class VariableDto {
    id!: string;
    name!: string;
    description?: string;
    unitMeasure?: string;
}

export class VariableWithDetailsDto {
    variable!: VariableDto;
    goals!: VariableGoalDto[];
    advances!: VariableAdvanceDto[];
    calculatedValue?: number | null;
    lastCalculationDate?: Date | null;
}

export class IndicatorDto {
    id!: string;
    code?: string;
    name?: string;
    description?: string;
    unitMeasure?: string;
}

export class IndicatorDetailsResponseDto {
    indicator!: IndicatorDto;
    goals!: IndicatorGoalDto[];
    advances!: IndicatorAdvanceDto[];
    variables!: VariableWithDetailsDto[];
}
