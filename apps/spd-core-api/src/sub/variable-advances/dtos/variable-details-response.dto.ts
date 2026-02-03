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
    createAt?: Date;
}

export class VariableQuadrenniumDto {
    id!: string;
    startYear!: number;
    endYear!: number;
    value!: number;
}

export class VariableDto {
    id!: string;
    code!: string;
    name!: string;
    observations?: string;
}

export class VariableDetailsResponseDto {
    variable!: VariableDto;
    goals!: VariableGoalDto[];
    quadrenniums!: VariableQuadrenniumDto[];
    advances!: VariableAdvanceDto[];
}
