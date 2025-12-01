import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCourierDto {
  @ApiProperty({ example: 'courier-uuid' })
  @IsUUID()
  courierId: string;
}



