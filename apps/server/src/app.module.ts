import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import * as Joi from 'joi';

import { PrismaModule } from './common/prisma/prisma.module';
import { CacheServiceModule } from './cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AppManagerModule } from './modules/app-manager/app-manager.module';
import { DataModelModule } from './modules/data-model/data-model.module';
import { PageModule } from './modules/page/page.module';
import { ComponentModule } from './modules/component/component.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PermissionModule } from './modules/permission/permission.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        SERVER_PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required().min(16),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Bull queue (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('REDIS_URL'),
      }),
    }),

    // Internal modules
    PrismaModule,
    CacheServiceModule,
    AuthModule,
    UserModule,
    AppManagerModule,
    DataModelModule,
    PageModule,
    ComponentModule,
    WorkflowModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
