import { Injectable, Logger } from "@nestjs/common";

export interface EvaluationContext {
    variableId?: string; // The variable being updated (optional context)
    year?: number; // Context year
    month?: number; // Context month
    fetchAdvancesSum: (variableId: string, year: number | null, months: number[]) => Promise<number>;
    fetchIndicatorGoal: (goalId: string) => Promise<number>;
    goalValues: Record<string, number>;
    subFormulaResults: Record<string, number>;
    baseline?: number;
}

@Injectable()
export class AstEvaluatorService {
    private readonly logger = new Logger(AstEvaluatorService.name);
    private _depth = 0;

    private log(message: string) {
        const indent = "  ".repeat(this._depth);
        this.logger.debug(`[AST] ${indent}${message}`);
    }

    async evaluate(node: any, ctx: EvaluationContext): Promise<number> {
        if (!node) {
            this.log("NULL node -> 0");
            return 0;
        }

        this._depth++;
        const result = await this.evaluateNode(node, ctx);
        this._depth--;
        return result;
    }

    private async evaluateNode(node: any, ctx: EvaluationContext): Promise<number> {
        switch (node.kind) {
            case "const":
                return this.evaluateConst(node);
            case "baseline":
                return this.evaluateBaseline(ctx);
            case "goal_var":
                return this.evaluateGoalVar(node, ctx);
            case "goal_ind":
                return this.evaluateGoalInd(node, ctx);
            case "quad_ind":
                return this.evaluateQuadInd(node, ctx);
            case "quad_var":
                return this.evaluateQuadVar(node, ctx);
            case "ref":
                return this.evaluateRef(node, ctx);
            case "binary":
                return this.evaluateBinary(node, ctx);
            case "call":
                return this.evaluateCall(node, ctx);
            default:
                this.log(`UNKNOWN kind: ${node.kind} -> 0`);
                return 0;
        }
    }

    private evaluateConst(node: any): number {
        const result = Number(node.value) || 0;
        this.log(`CONST: ${result}`);
        return result;
    }

    private evaluateBaseline(ctx: EvaluationContext): number {
        const result = ctx.baseline || 0;
        this.log(`BASELINE: ${result}`);
        return result;
    }

    private evaluateGoalVar(node: any, ctx: EvaluationContext): number {
        const goalVarId = node.value;
        if (goalVarId && ctx.goalValues[goalVarId] !== undefined) {
            const result = ctx.goalValues[goalVarId];
            this.log(`GOAL_VAR [${goalVarId}]: ${result}`);
            return result;
        }
        this.log(`GOAL_VAR [${goalVarId}]: NOT FOUND -> 0`);
        return 0;
    }

    private async evaluateGoalInd(node: any, ctx: EvaluationContext): Promise<number> {
        const goalIndId = node.value;
        this.log(`GOAL_IND: Fetching indicator goal [${goalIndId}]`);
        if (!goalIndId) {
            this.log(`  -> Invalid ID -> 0`);
            return 0;
        }
        const result = await ctx.fetchIndicatorGoal(goalIndId);
        this.log(`  -> Indicator goal value: ${result}`);
        return result;
    }

    private async evaluateQuadInd(node: any, ctx: EvaluationContext): Promise<number> {
        const quadIndId = node.value;
        this.log(`QUAD_IND: Fetching [${quadIndId}]`);
        if (!quadIndId) return 0;
        return ctx.fetchIndicatorGoal(quadIndId);
    }

    private evaluateQuadVar(node: any, ctx: EvaluationContext): number {
        const quadVarId = node.value;
        if (quadVarId && ctx.goalValues[quadVarId] !== undefined) {
            const result = ctx.goalValues[quadVarId];
            this.log(`QUAD_VAR [${quadVarId}]: ${result}`);
            return result;
        }
        this.log(`QUAD_VAR [${quadVarId}]: NOT FOUND -> 0`);
        return 0;
    }

    private async evaluateRef(node: any, ctx: EvaluationContext): Promise<number> {
        const variableRefId = node.value;
        const subFormula = node.subFormula;
        this.log(`REF: Variable=${variableRefId}, Has SubFormula=${!!subFormula}`);

        if (!subFormula || !variableRefId) return 0;

        const subCtx = { ...ctx, variableId: variableRefId };
        const result = await this.evaluate(subFormula, subCtx);
        ctx.subFormulaResults[variableRefId] = result;
        this.log(`  -> SubFormula result for ${variableRefId}: ${result}`);
        return result;
    }

    private async evaluateBinary(node: any, ctx: EvaluationContext): Promise<number> {
        const op = node.op;
        this.log(`BINARY: ${op}`);

        const left = await this.evaluate(node.left, ctx);
        const right = await this.evaluate(node.right, ctx);
        let result = 0;

        switch (op) {
            case "+": result = left + right; break;
            case "-": result = left - right; break;
            case "*": result = left * right; break;
            case "/": result = right === 0 ? 0 : left / right; break;
            case "=": result = left === right ? 1 : 0; break;
            case ">": result = left > right ? 1 : 0; break;
            case "<": result = left < right ? 1 : 0; break;
            case ">=": result = left >= right ? 1 : 0; break;
            case "<=": result = left <= right ? 1 : 0; break;
            case "!=": result = left === right ? 0 : 1; break;
        }

        this.log(`  -> ${left} ${op} ${right} = ${result}`);
        return result;
    }

    private async evaluateCall(node: any, ctx: EvaluationContext): Promise<number> {
        const func = node.func?.toUpperCase();
        const args = node.args || [];
        this.log(`CALL: ${func} with ${args.length} args`);

        if (!args.length) return 0;

        const evaluatedArgs: number[] = [];
        for (const arg of args) {
            evaluatedArgs.push(await this.evaluate(arg, ctx));
        }

        let result = 0;
        switch (func) {
            case "SUM":
                result = evaluatedArgs.reduce((a, b) => a + b, 0);
                break;
            case "MAX":
                result = Math.max(...evaluatedArgs);
                break;
            case "MIN":
                result = Math.min(...evaluatedArgs);
                break;
            case "AVG":
                result = evaluatedArgs.reduce((a, b) => a + b, 0) / evaluatedArgs.length;
                break;
            case "IF":
                if (evaluatedArgs.length >= 3) {
                    const condition = evaluatedArgs[0] !== 0;
                    result = condition ? evaluatedArgs[1] : evaluatedArgs[2];
                }
                break;
        }

        this.log(`  -> ${func}() = ${result}`);
        return result;
    }
}
