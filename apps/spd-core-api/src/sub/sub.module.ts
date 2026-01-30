import { Module } from "@nestjs/common";
import { VariableAdvancesModule } from "./variable-advances/variable-advances.module";
import { IndicatorAdvancesModule } from "./indicator-advances/indicator-advances.module";

@Module({
    imports: [
        VariableAdvancesModule,
        IndicatorAdvancesModule,
    ],
    exports: [
        VariableAdvancesModule,
    ],
})
export class SubModule { }
