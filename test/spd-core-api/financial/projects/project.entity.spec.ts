import { Project } from '../../../../apps/spd-core-api/src/financial/projects/entities/project.entity';

describe('Project Entity', () => {
    describe('calculateFinancialExecution', () => {
        it('should calculate percentage when currentBudget > 0', () => {
            const project = new Project();
            project.currentBudget = 1000;
            project.execution = 500;
            project.calculateFinancialExecution();
            expect(project.financialExecutionPercentage).toBe(0.5);
        });

        it('should return 0 when currentBudget is 0', () => {
            const project = new Project();
            project.currentBudget = 0;
            project.execution = 500;
            project.calculateFinancialExecution();
            expect(project.financialExecutionPercentage).toBe(0);
        });

        it('should handle undefined values', () => {
            const project = new Project();
            project.currentBudget = undefined;
            project.execution = undefined;
            project.calculateFinancialExecution();
            expect(project.financialExecutionPercentage).toBe(0);
        });

        it('should round to 2 decimal places', () => {
            const project = new Project();
            project.currentBudget = 3;
            project.execution = 1;
            project.calculateFinancialExecution();
            expect(project.financialExecutionPercentage).toBe(0.33);
        });

        it('should handle 100% execution', () => {
            const project = new Project();
            project.currentBudget = 1000;
            project.execution = 1000;
            project.calculateFinancialExecution();
            expect(project.financialExecutionPercentage).toBe(1);
        });
    });
});
