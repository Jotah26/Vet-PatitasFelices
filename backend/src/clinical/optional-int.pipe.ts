import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OptionalIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('Validation failed (numeric string is expected)');
    }
    return parsed;
  }
}
