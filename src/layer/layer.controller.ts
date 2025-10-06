import { Controller, Post } from '@nestjs/common';
import { LayerService } from './layer.service';

@Controller('layer')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}

  @Post('process')
  async processLayer() {
    const data = await this.layerService.processQuery();
    console.log('daat', data);
    return { data: data, message: 'Layer processed successfully' };
  }
}
