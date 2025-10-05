import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BluePrintModule } from './blue_print/bluePrint.module';

@Module({
  imports: [BluePrintModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
