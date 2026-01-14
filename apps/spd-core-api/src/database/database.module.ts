import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const db = cfg.get<any>("database");
        return {
          type: "postgres",
          url: db.url,
          autoLoadEntities: true,
          synchronize: true, // usa migraciones en producción
        };
      },
    }),
  ],
})
export class DatabaseModule {}
