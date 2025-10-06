import { Controller, Post, UseGuards } from '@nestjs/common';
import { LayerService } from './layer.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Layer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('layer')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}

  @Post('process')
  @ApiOperation({
    description: 'Generates the correct prompt based on the user query',
  })
  async processLayer() {
    const data = await this.layerService.processQuery();
    return { data: data, message: 'Layer processed successfully' };
  }
}
