import { Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export class CustomerInfoDto {
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    phone: string;
}

export class ShippingInfoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fullName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    addressLine1: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine2?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    region: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    phone: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    deliveryInstructions?: string;
}

export class CheckoutDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    sessionId: string;

    @ValidateNested()
    @Type(() => CustomerInfoDto)
    customer: CustomerInfoDto;

    @ValidateNested()
    @Type(() => ShippingInfoDto)
    shipping: ShippingInfoDto;
}
