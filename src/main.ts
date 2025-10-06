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
      'API documentation for Plan Generation Before Executing the correct plan on any chat agent',
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
