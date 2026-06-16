import { Module } from '@nestjs/common';
import { DataModelService } from './data-model.service';
import { DataModelController } from './data-model.controller';
import { DynamicDataService } from './dynamic-data.service';
import { DynamicDataController } from './dynamic-data.controller';

@Module({
  controllers: [DataModelController, DynamicDataController],
  providers: [DataModelService, DynamicDataService],
  exports: [DataModelService, DynamicDataService],
})
export class DataModelModule {}
