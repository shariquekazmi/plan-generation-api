import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LayerDocument = Layer & Document;

@Schema({ timestamps: true })
export class Layer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // owner

  @Prop({ required: true })
  initialPrompt: string; // first prompt user submitted

  // conversation between user <-> agent while refining the prompt
  @Prop({
    type: [
      {
        sender: { type: String, enum: ['user', 'agent'], required: true },
        content: { type: String, required: true },
        suggestions: { type: [String], default: [] }, // new field for agent suggestions
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  messages: {
    sender: 'user' | 'agent';
    content: string;
    suggestions?: string[];
    createdAt: Date;
  }[];

  @Prop()
  finalPrompt?: string; // set when user confirms

  @Prop()
  generatedResponse?: string; // answer from Gemini (only after final)

  @Prop({
    type: String,
    enum: ['draft', 'awaiting_user', 'finalized', 'generated'],
    default: 'draft',
  })
  status: 'draft' | 'awaiting_user' | 'finalized' | 'generated';

  @Prop({ default: false })
  readyForGeneration: boolean;

  @Prop({
    type: [
      {
        previousPrompt: String,
        editedBy: { type: Types.ObjectId, ref: 'User' },
        editedAt: Date,
      },
    ],
    default: [],
  })
  editHistory: {
    previousPrompt: string;
    editedBy: Types.ObjectId;
    editedAt: Date;
  }[];
}

export const LayerSchema = SchemaFactory.createForClass(Layer);
