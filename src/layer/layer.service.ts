import { Injectable } from '@nestjs/common';
import { OutboundCallService } from 'src/service/outboundCall.service';

@Injectable()
export class LayerService {
  constructor(private readonly outboundCallService: OutboundCallService) {}

  async processQuery() {
    return await this.outboundCallService.geminiApiCall();
  }
}
