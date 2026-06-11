import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CompaniesController } from './companies.controller';
@Module({ imports: [DatabaseModule], controllers: [CompaniesController] })
export class CompaniesModule {}
