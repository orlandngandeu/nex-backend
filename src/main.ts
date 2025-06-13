import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Nex manage API')
    .setDescription("Premiere version de l'API  nexManage")
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // configuration cors
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'Set-Cookie',
      'Cross-Origin-Resource-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Embedder-Policy',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: [
      'Set-Cookie',
      'Cross-Origin-Resource-Policy',
      'Cross-Origin-Opener-Policy',
    ],
  });

  //middlewares
  app.use(cookieParser());

  app.setGlobalPrefix('api');

  //pipes  globaux
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(configService.get<number>('APP_PORT') || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
