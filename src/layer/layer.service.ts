import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Layer, LayerDocument } from './modelsAndSchema/layer.schema';
import { OutboundCallService } from 'src/service/outboundCall.service';

@Injectable()
export class LayerService {
  constructor(
    @InjectModel(Layer.name) private layerModel: Model<LayerDocument>,
    private outboundCallService: OutboundCallService,
  ) {}

  /**
   *  User creates a draft prompt
   */
  async createDraft(
    initialPrompt: string,
    user: { userId?: string; _id?: string },
  ) {
    const ownerId = user?._id;
    if (!ownerId) throw new Error('User not found in request');
    const layer = await this.layerModel.create({
      userId: new Types.ObjectId(ownerId),
      initialPrompt,
      messages: [
        { sender: 'user', content: initialPrompt, createdAt: new Date() },
      ],
      status: 'draft',
      readyForGeneration: false,
    });

    // Evaluate/refine the prompt
    const evalResult =
      await this.outboundCallService.evaluatePromptForRefinement(initialPrompt);

    layer.messages.push({
      sender: 'agent',
      content: evalResult.message,
      suggestions: evalResult.suggestions || [],
      createdAt: new Date(),
    });

    layer.status = 'awaiting_user';
    await layer.save();
    return layer;
  }

  /**
   *  User replies / edits or confirms
   */
  async replyToAgent(
    layerId: string,
    user: any,
    content: string,
    action: 'edit' | 'confirm',
  ) {
    console.log(user);
    const layer = await this.layerModel.findById(layerId);
    console.log('Layer found:', layer);
    if (!layer) throw new NotFoundException('Layer not found');
    const ownerId = user._id || user.userId;
    console.log('Owner ID:', ownerId);
    if (layer.userId.toString() !== ownerId.toString())
      throw new ForbiddenException();

    // Save user's reply
    layer.messages.push({ sender: 'user', content, createdAt: new Date() });

    if (action === 'confirm') {
      console.log('User confirmed the prompt.');
      // User approves final prompt
      layer.finalPrompt = content || layer.initialPrompt;
      layer.readyForGeneration = true;
      layer.status = 'finalized';
      await layer.save();
      return { message: 'Prompt finalized. Ready for generation.', layer };
    } else {
      // User edits — track edit history
      layer.editHistory.push({
        previousPrompt: layer.initialPrompt,
        editedBy: ownerId,
        editedAt: new Date(),
      });

      // Re-evaluate latest prompt content
      const evalResult =
        await this.outboundCallService.evaluatePromptForRefinement(content);

      layer.messages.push({
        sender: 'agent',
        content: evalResult.message,
        suggestions: evalResult.suggestions || [],
        createdAt: new Date(),
      });

      layer.status = 'awaiting_user';
      layer.initialPrompt = content; // update initialPrompt to latest user input
      await layer.save();
      return {
        message: 'Agent responded with refinement/clarifying question.',
        layer,
      };
    }
  }

  /**
   *  Generate final answer from Gemini (only after approval)
   */
  async generateFromFinal(layerId: string, user: any) {
    const layer = await this.layerModel.findById(layerId);
    if (!layer) throw new NotFoundException('Layer not found');
    const ownerId = user._id || user.userId;
    if (layer.userId.toString() !== ownerId.toString())
      throw new ForbiddenException();

    if (!layer.readyForGeneration || layer.status !== 'finalized') {
      throw new Error(
        'Prompt is not finalized. Confirm the prompt before generating an answer.',
      );
    }

    const promptToSend = layer.finalPrompt || layer.initialPrompt;
    const answer = await this.outboundCallService.geminiApiCall(promptToSend);

    layer.generatedResponse = answer;
    layer.status = 'generated';
    await layer.save();
    return { message: 'Generated successfully', layer };
  }

  /**
   * Fetch layer by ID for a user
   */
  async getLayerById(layerId: string, user: any) {
    const layer = await this.layerModel.findById(layerId);
    if (!layer) throw new NotFoundException('Layer not found');
    const ownerId = user.userId;
    if (layer.userId.toString() !== ownerId.toString())
      throw new ForbiddenException();
    return layer;
  }
}
