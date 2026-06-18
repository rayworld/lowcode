import { Module } from '@nestjs/common';
import { DataModelService } from './data-model.service';
import { DataModelController } from './data-model.controller';
import { DynamicDataService } from './dynamic-data.service';
import { DynamicDataController } from './dynamic-data.controller';
import { ModelVersionService } from './model-version.service';
import { ModelVersionController } from './model-version.controller';
import { CodegenService } from './codegen.service';
import { CodegenController } from './codegen.controller';
import { DataPermissionService } from './data-permission.service';
import { OptionSetService } from './option-set.service';
import { OptionSetController } from './option-set.controller';

@Module({
  controllers: [DataModelController, DynamicDataController, ModelVersionController, CodegenController, OptionSetController],
  providers: [DataModelService, DynamicDataService, ModelVersionService, CodegenService, DataPermissionService, OptionSetService],
  exports: [DataModelService, DynamicDataService, ModelVersionService, CodegenService, DataPermissionService, OptionSetService],
})
export class DataModelModule {}
