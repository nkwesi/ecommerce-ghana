import { IsString, IsOptional, IsBoolean, IsIn, Length } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @IsString()
    @IsIn(['home', 'work', 'shipping'])
    type?: string;

    @IsString()
    @Length(1, 255)
    line1: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    line2?: string;

    @IsString()
    @Length(1, 100)
    city: string;

    @IsString()
    @Length(1, 100)
    region: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    country?: string;

    @IsString()
    @Length(1, 20)
    phone: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    @IsOptional()
    @IsString()
    @IsIn(['home', 'work', 'shipping'])
    type?: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    line1?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    line2?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    city?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    region?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    country?: string;

    @IsOptional()
    @IsString()
    @Length(1, 20)
    phone?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
