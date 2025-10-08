import { Module } from '@nestjs/common';
import { LayerController } from './layer.controller';
import { LayerService } from './layer.service';
import { OutboundCallService } from 'src/service/outboundCall.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Layer, LayerSchema } from './modelsAndSchema/layer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Layer.name, schema: LayerSchema }]),
  ],
  controllers: [LayerController],
  providers: [LayerService, OutboundCallService],
  exports: [LayerService],
})
export class LayerModule {}
