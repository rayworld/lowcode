import { Module } from '@nestjs/common';
import { AppManagerService } from './app-manager.service';
import { AppManagerController } from './app-manager.controller';

@Module({
  controllers: [AppManagerController],
  providers: [AppManagerService],
  exports: [AppManagerService],
})
export class AppManagerModule {}
