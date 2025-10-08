import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LayerService } from './layer.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as expressRequestInterface from 'src/types/express-request.interface';

@ApiTags('Layer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('layer')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}

  // =====================
  // Create Draft
  // =====================
  @Post('draft')
  @ApiOperation({
    summary: 'Create a new prompt draft',
    description:
      'Creates a new Layer draft with the user’s initial prompt. The agent will evaluate it and return suggestions or clarifications before confirmation.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', example: 'Explain quantum computing simply' },
      },
      required: ['prompt'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Draft created and agent’s initial response returned.',
  })
  async createDraft(
    @Body() body: { prompt: string },
    @Req() req: expressRequestInterface.AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    return this.layerService.createDraft(body.prompt, user);
  }

  // =====================
  // Reply / Edit / Confirm
  // =====================
  @Post(':layerId/reply')
  @ApiOperation({
    summary: 'Reply or confirm prompt refinement',
    description:
      'Allows user to edit or confirm the current prompt during refinement. The agent re-evaluates edits until the prompt is finalized.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Make it sound beginner-friendly for school students',
        },
        action: {
          type: 'string',
          enum: ['edit', 'confirm'],
          example: 'edit',
        },
      },
      required: ['content', 'action'],
    },
  })
  async replyToAgent(
    @Param('layerId') layerId: string,
    @Body() body: { content: string; action: 'edit' | 'confirm' },
    @Req() req: expressRequestInterface.AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    return this.layerService.replyToAgent(
      layerId,
      user,
      body.content,
      body.action,
    );
  }

  // =====================
  // Generate Final Response
  // =====================
  @Post('generate/:id')
  @ApiOperation({
    summary: 'Generate final response from Gemini',
    description:
      'Once the user confirms the prompt, this endpoint sends it to Gemini and returns the generated answer.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the Layer document (finalized prompt)',
    example: '652f1a9c8b1d4c3f8a1e7b21',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the generated answer from Gemini for the final prompt.',
  })
  async generate(
    @Param('id') id: string,
    @Req() req: expressRequestInterface.AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    return this.layerService.generateFromFinal(id, user);
  }

  // =====================
  // Get Layer by ID
  // =====================
  @Get(':id')
  @ApiOperation({
    summary: 'Get Layer details',
    description:
      'Fetches the complete Layer document (prompt, messages, agent clarifications, final response, etc.).',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the Layer document',
    example: '652f1a9c8b1d4c3f8a1e7b21',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns Layer details for the authenticated user.',
  })
  async getLayer(
    @Param('id') id: string,
    @Req() req: expressRequestInterface.AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    return this.layerService.getLayerById(id, user);
  }
}
