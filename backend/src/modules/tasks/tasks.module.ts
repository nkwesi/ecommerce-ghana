import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [ScheduleModule.forRoot(), InventoryModule],
    providers: [ScheduledTasksService],
})
export class TasksModule { }
