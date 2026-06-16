import { Module } from '@nestjs/common';
import { PageService } from './page.service';
import { PageController } from './page.controller';

@Module({
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
