import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { apiValidationPipe } from './common/validation/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(apiValidationPipe);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('PhysioGhar Therapist API')
    .setDescription('HTTP API for the PhysioGhar therapist app')
    .setVersion('1.0')
    .addTag('Auth')
    .addTag('Therapist profile')
    .addTag('Dashboard')
    .addTag('Schedule and slots')
    .addTag('Sessions')
    .addTag('Patients')
    .addTag('Notes')
    .addTag('Complaints')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
