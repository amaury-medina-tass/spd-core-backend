import { Test, TestingModule } from '@nestjs/testing';
import { AstEvaluatorService, EvaluationContext } from '../../../../apps/spd-core-api/src/sub/variable-advances/services/ast-evaluator.service';

describe('AstEvaluatorService', () => {
    let service: AstEvaluatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AstEvaluatorService],
        }).compile();

        service = module.get<AstEvaluatorService>(AstEvaluatorService);
    });

    function buildCtx(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
        return {
            variableId: 'var-1',
            year: 2025,
            month: 6,
            fetchAdvancesSum: jest.fn().mockResolvedValue(0),
            fetchIndicatorGoal: jest.fn().mockResolvedValue(0),
            goalValues: {},
            subFormulaResults: {},
            baseline: 100,
            ...overrides,
        };
    }

    describe('evaluate', () => {
        it('should return 0 for null node', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate(null, ctx)).toBe(0);
        });

        it('should return 0 for undefined node', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate(undefined, ctx)).toBe(0);
        });
    });

    describe('const', () => {
        it('should return numeric value', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'const', value: 42 }, ctx)).toBe(42);
        });

        it('should return 0 for non-numeric value', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'const', value: 'abc' }, ctx)).toBe(0);
        });

        it('should parse string numbers', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'const', value: '3.14' }, ctx)).toBe(3.14);
        });
    });

    describe('baseline', () => {
        it('should return baseline from context', async () => {
            const ctx = buildCtx({ baseline: 50 });
            expect(await service.evaluate({ kind: 'baseline' }, ctx)).toBe(50);
        });

        it('should return 0 when no baseline', async () => {
            const ctx = buildCtx({ baseline: undefined });
            expect(await service.evaluate({ kind: 'baseline' }, ctx)).toBe(0);
        });
    });

    describe('goal_var', () => {
        it('should return goal value when found', async () => {
            const ctx = buildCtx({ goalValues: { 'g1': 75 } });
            expect(await service.evaluate({ kind: 'goal_var', value: 'g1' }, ctx)).toBe(75);
        });

        it('should return 0 when goal not found', async () => {
            const ctx = buildCtx({ goalValues: {} });
            expect(await service.evaluate({ kind: 'goal_var', value: 'missing' }, ctx)).toBe(0);
        });
    });

    describe('goal_ind', () => {
        it('should fetch indicator goal', async () => {
            const fetchMock = jest.fn().mockResolvedValue(88);
            const ctx = buildCtx({ fetchIndicatorGoal: fetchMock });
            expect(await service.evaluate({ kind: 'goal_ind', value: 'ind-1' }, ctx)).toBe(88);
            expect(fetchMock).toHaveBeenCalledWith('ind-1');
        });

        it('should return 0 for null goalIndId', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'goal_ind', value: null }, ctx)).toBe(0);
        });
    });

    describe('quad_ind', () => {
        it('should fetch via fetchIndicatorGoal', async () => {
            const fetchMock = jest.fn().mockResolvedValue(99);
            const ctx = buildCtx({ fetchIndicatorGoal: fetchMock });
            expect(await service.evaluate({ kind: 'quad_ind', value: 'qi-1' }, ctx)).toBe(99);
        });

        it('should return 0 for null id', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'quad_ind', value: null }, ctx)).toBe(0);
        });
    });

    describe('quad_var', () => {
        it('should return value from goalValues', async () => {
            const ctx = buildCtx({ goalValues: { 'qv-1': 33 } });
            expect(await service.evaluate({ kind: 'quad_var', value: 'qv-1' }, ctx)).toBe(33);
        });

        it('should return 0 when not found', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'quad_var', value: 'missing' }, ctx)).toBe(0);
        });
    });

    describe('ref', () => {
        it('should evaluate sub-formula with variable context', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'ref',
                value: 'var-2',
                subFormula: { kind: 'const', value: 55 },
            };
            const result = await service.evaluate(node, ctx);
            expect(result).toBe(55);
            expect(ctx.subFormulaResults['var-2']).toBe(55);
        });

        it('should return 0 when no subFormula', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'ref', value: 'var-2' }, ctx)).toBe(0);
        });

        it('should return 0 when no variableRefId', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'ref', value: null, subFormula: { kind: 'const', value: 5 } }, ctx)).toBe(0);
        });
    });

    describe('binary operations', () => {
        it('should add two values', async () => {
            const ctx = buildCtx();
            const node = { kind: 'binary', op: '+', left: { kind: 'const', value: 10 }, right: { kind: 'const', value: 20 } };
            expect(await service.evaluate(node, ctx)).toBe(30);
        });

        it('should subtract', async () => {
            const ctx = buildCtx();
            const node = { kind: 'binary', op: '-', left: { kind: 'const', value: 50 }, right: { kind: 'const', value: 20 } };
            expect(await service.evaluate(node, ctx)).toBe(30);
        });

        it('should multiply', async () => {
            const ctx = buildCtx();
            const node = { kind: 'binary', op: '*', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 4 } };
            expect(await service.evaluate(node, ctx)).toBe(20);
        });

        it('should divide', async () => {
            const ctx = buildCtx();
            const node = { kind: 'binary', op: '/', left: { kind: 'const', value: 100 }, right: { kind: 'const', value: 4 } };
            expect(await service.evaluate(node, ctx)).toBe(25);
        });

        it('should return 0 for division by zero', async () => {
            const ctx = buildCtx();
            const node = { kind: 'binary', op: '/', left: { kind: 'const', value: 100 }, right: { kind: 'const', value: 0 } };
            expect(await service.evaluate(node, ctx)).toBe(0);
        });

        it('should compare equal (=)', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'binary', op: '=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(1);
            expect(await service.evaluate({ kind: 'binary', op: '=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 3 } }, ctx)).toBe(0);
        });

        it('should compare > and <', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'binary', op: '>', left: { kind: 'const', value: 10 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(1);
            expect(await service.evaluate({ kind: 'binary', op: '<', left: { kind: 'const', value: 3 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(1);
        });

        it('should compare >= and <=', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'binary', op: '>=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(1);
            expect(await service.evaluate({ kind: 'binary', op: '<=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(1);
        });

        it('should compare !=', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'binary', op: '!=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 3 } }, ctx)).toBe(1);
            expect(await service.evaluate({ kind: 'binary', op: '!=', left: { kind: 'const', value: 5 }, right: { kind: 'const', value: 5 } }, ctx)).toBe(0);
        });
    });

    describe('call functions', () => {
        it('SUM should add all args', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'SUM',
                args: [{ kind: 'const', value: 10 }, { kind: 'const', value: 20 }, { kind: 'const', value: 30 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(60);
        });

        it('MAX should return maximum', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'MAX',
                args: [{ kind: 'const', value: 5 }, { kind: 'const', value: 99 }, { kind: 'const', value: 42 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(99);
        });

        it('MIN should return minimum', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'MIN',
                args: [{ kind: 'const', value: 5 }, { kind: 'const', value: 99 }, { kind: 'const', value: 42 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(5);
        });

        it('AVG should return average', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'AVG',
                args: [{ kind: 'const', value: 10 }, { kind: 'const', value: 20 }, { kind: 'const', value: 30 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(20);
        });

        it('IF should return truthy branch when condition is non-zero', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'IF',
                args: [{ kind: 'const', value: 1 }, { kind: 'const', value: 100 }, { kind: 'const', value: 200 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(100);
        });

        it('IF should return falsy branch when condition is zero', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'IF',
                args: [{ kind: 'const', value: 0 }, { kind: 'const', value: 100 }, { kind: 'const', value: 200 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(200);
        });

        it('should return 0 for no args', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'call', func: 'SUM', args: [] }, ctx)).toBe(0);
        });

        it('should be case insensitive for func name', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'sum',
                args: [{ kind: 'const', value: 1 }, { kind: 'const', value: 2 }],
            };
            expect(await service.evaluate(node, ctx)).toBe(3);
        });
    });

    describe('unknown kind', () => {
        it('should return 0 for unknown node kind', async () => {
            const ctx = buildCtx();
            expect(await service.evaluate({ kind: 'something_else' }, ctx)).toBe(0);
        });
    });

    describe('nested expressions', () => {
        it('should handle nested binary + call', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'binary', op: '+',
                left: {
                    kind: 'call', func: 'SUM',
                    args: [{ kind: 'const', value: 10 }, { kind: 'const', value: 20 }],
                },
                right: { kind: 'const', value: 5 },
            };
            expect(await service.evaluate(node, ctx)).toBe(35);
        });

        it('should handle IF with binary condition', async () => {
            const ctx = buildCtx();
            const node = {
                kind: 'call', func: 'IF',
                args: [
                    { kind: 'binary', op: '>', left: { kind: 'const', value: 10 }, right: { kind: 'const', value: 5 } },
                    { kind: 'const', value: 100 },
                    { kind: 'const', value: 200 },
                ],
            };
            expect(await service.evaluate(node, ctx)).toBe(100);
        });
    });
});
