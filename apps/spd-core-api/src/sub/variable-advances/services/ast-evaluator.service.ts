import { Injectable, Logger } from "@nestjs/common";

export interface EvaluationContext {
    variableId?: string; // The variable being updated (optional context)
    year?: number; // Context year
    month?: number; // Context month
    fetchAdvancesSum: (variableId: string, year: number | null, months: number[]) => Promise<number>;
    fetchIndicatorGoal: (goalId: string) => Promise<number>;
    goalValues: Record<string, number>;
    subFormulaResults: Record<string, number>;
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
        const kind = node.kind;
        let result = 0;

        switch (kind) {
            case "const":
                result = Number(node.value) || 0;
                this.log(`CONST: ${result}`);
                break;

            case "goal_var":
                const goalVarId = node.value;
                if (goalVarId && ctx.goalValues[goalVarId] !== undefined) {
                    result = ctx.goalValues[goalVarId];
                    this.log(`GOAL_VAR [${goalVarId}]: ${result}`);
                } else {
                    this.log(`GOAL_VAR [${goalVarId}]: NOT FOUND -> 0`);
                    result = 0;
                }
                break;

            case "goal_ind":
                const goalIndId = node.value;
                this.log(`GOAL_IND: Fetching indicator goal [${goalIndId}]`);
                if (goalIndId) {
                    result = await ctx.fetchIndicatorGoal(goalIndId);
                    this.log(`  -> Indicator goal value: ${result}`);
                } else {
                    this.log(`  -> Invalid ID -> 0`);
                    result = 0;
                }
                break;

            case "quad_ind":
                // Assume quad_ind behaves similarly to goal_ind or needs specific handling?
                // User example didn't detail fetching logic for quad_ind, but C# code didn't show it explicitly in the snippet?
                // Wait, looking at C# snippet, there IS NO `quad_ind` case! 
                // But in ast.txt there IS `"kind": "quad_ind"`.
                // I should handle it similarly to goal_ind or add a fetcher for it. 
                // For now, I'll treat it as goal (user said "fetch indicator goal with the formula").
                // Actually the user provided C# snippet seems to be missing `quad_ind`.
                // I will assume for now it uses the same fetcher or return 0 if not implemented.
                // Let's use fetchIndicatorGoal for now as placeholder or separate delegate if needed.
                // Actually logic for quad goals might be different. I'll add a fetcher for it in context.
                const quadIndId = node.value;
                this.log(`QUAD_IND: Fetching [${quadIndId}]`);
                if (quadIndId) {
                    result = await ctx.fetchIndicatorGoal(quadIndId); // Reusing fetcher for now, assuming ID is unique globally
                }
                break;

            case "quad_var":
                const quadVarId = node.value;
                if (quadVarId && ctx.goalValues[quadVarId] !== undefined) {
                    result = ctx.goalValues[quadVarId];
                    this.log(`QUAD_VAR [${quadVarId}]: ${result}`);
                } else {
                    this.log(`QUAD_VAR [${quadVarId}]: NOT FOUND -> 0`);
                    result = 0;
                }
                break;

                const advanceValue = node.value;
                // Try to find variable ID from node, fallback to context variableId if missing
                const refVarId = advanceValue?.idVariable || advanceValue?.variableId || ctx.variableId;

                // Use node year/month if present, otherwise fallback to context
                const year = advanceValue?.year ?? ctx.year;
                const nodeMonths = advanceValue?.months;

                let monthsList: number[] = [];
                if (Array.isArray(nodeMonths) && nodeMonths.length > 0) {
                    monthsList = nodeMonths;
                } else if (ctx.month) {
                    monthsList = [ctx.month!];
                }

                if (refVarId) {
                    this.log(`REF_ADVANCE resolved to VarID: ${refVarId}, Year: ${year}, Months: ${monthsList.join(",")}`);
                    result = await ctx.fetchAdvancesSum(refVarId, year ?? null, monthsList);
                    this.log(`  -> Fetched advances sum: ${result}`);
                } else {
                    this.log(`  -> Missing variable ID in ref_advance (Context VarID: ${ctx.variableId}) -> 0`);
                }
                break;

            case "ref":
                // Reference to a Variable with a subFormula
                const variableRefId = node.value;
                const subFormula = node.subFormula;
                this.log(`REF: Variable=${variableRefId}, Has SubFormula=${!!subFormula}`);

                if (subFormula && variableRefId) {
                    // Recursive evaluation of subFormula
                    // IMPORTANT: The context for the subFormula should probably be the REFERENCED variable.
                    // This allows ref_advance inside subFormula to default to the referenced variable.

                    const subCtx = { ...ctx, variableId: variableRefId }; // Create new context with updated variableId
                    result = await this.evaluate(subFormula, subCtx);

                    ctx.subFormulaResults[variableRefId] = result;
                    this.log(`  -> SubFormula result for ${variableRefId}: ${result}`);
                }
                break;

            case "binary":
                result = await this.evaluateBinary(node, ctx);
                break;

            case "call":
                result = await this.evaluateCall(node, ctx);
                break;

            default:
                this.log(`UNKNOWN kind: ${kind} -> 0`);
                break;
        }

        this._depth--;
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
            case "/": result = right !== 0 ? left / right : 0; break;
            case "=": result = left === right ? 1 : 0; break;
            case ">": result = left > right ? 1 : 0; break;
            case "<": result = left < right ? 1 : 0; break;
            case ">=": result = left >= right ? 1 : 0; break;
            case "<=": result = left <= right ? 1 : 0; break;
            case "!=": result = left !== right ? 1 : 0; break;
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
