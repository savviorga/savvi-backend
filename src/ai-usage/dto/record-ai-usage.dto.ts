import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AI_USAGE_ENDPOINTS,
  type AiUsageEndpoint,
} from '../entities/ai-usage.entity';

const MAX_TOKENS = 10_000_000;

export class RecordAiUsageDto {
  @ApiProperty({ enum: AI_USAGE_ENDPOINTS, example: 'chat' })
  @IsIn(AI_USAGE_ENDPOINTS)
  endpoint: AiUsageEndpoint;

  @ApiPropertyOptional({ example: 'gpt-4o-mini-2024-07-18' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  @Max(100)
  calls: number;

  @ApiProperty({ example: 5400 })
  @IsInt()
  @Min(0)
  @Max(MAX_TOKENS)
  inputTokens: number;

  @ApiProperty({ example: 1200 })
  @IsInt()
  @Min(0)
  @Max(MAX_TOKENS)
  cachedTokens: number;

  @ApiProperty({ example: 380 })
  @IsInt()
  @Min(0)
  @Max(MAX_TOKENS)
  outputTokens: number;

  @ApiProperty({ example: 0.0012 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Max(100)
  costUsd: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  unpricedCalls?: number;
}
