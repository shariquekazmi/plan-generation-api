import { Module } from '@nestjs/common';
import { LayerController } from './layer.controller';
import { LayerService } from './layer.service';
import { OutboundCallService } from 'src/service/outboundCall.service';

@Module({
  imports: [],
  controllers: [LayerController],
  providers: [LayerService, OutboundCallService],
  exports: [LayerService],
})
export class LayerModule {}
