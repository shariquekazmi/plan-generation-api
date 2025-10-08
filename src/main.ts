import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Plan Generation API')
    .setDescription(
      `API documentation for **Plan Generation** before executing the correct plan on any chat agent.

Authentication:  
Use the following credentials to log in and obtain a JWT token:  
- Email: test@example.com  
- Password: 12345  

Include the JWT token in the Authorization: Bearer <token> header for all subsequent requests.

Flow of the Plan Generation API:

1. Login & Authentication
   - User logs in with the credentials to receive a JWT token. All other endpoints require this token in the Authorization header.

2. Create Draft Prompt (POST /layer/draft)
   - User submits an initial prompt. The system sends it to the AI agent for evaluation and refinement suggestions.
   - Response may include clarifying questions or improvement suggestions.
   - The draft is saved with status: awaiting_user.

3. Edit / Reply to AI Suggestions (POST /layer/reply)
   - User can edit the prompt or reply to the agent’s clarifications.
   - Each edit is tracked in editHistory.
   - The AI re-evaluates the prompt and may provide further refinements.
   - Repeat until the user confirms the prompt is final.

4. Confirm Final Prompt (POST /layer/reply with action: confirm)
   - User confirms the prompt.
   - Layer status changes to finalized and readyForGeneration: true.
   - Only confirmed prompts can generate final AI output.

5. Generate Final Plan / Response (POST /layer/generate/:id)
   - The system sends the confirmed prompt to the AI agent for the final plan or answer.
   - The AI response is saved in generatedResponse and layer status becomes generated.

6. Fetch Layer Details (GET /layer/:id)
   - Retrieve the current state of a layer, including messages, agent suggestions, edits, and the final AI response (if generated).`,
    )
    .setVersion('1.0')
    .addBearerAuth() // Enabling JWT auth in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT as string, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}
bootstrap();
