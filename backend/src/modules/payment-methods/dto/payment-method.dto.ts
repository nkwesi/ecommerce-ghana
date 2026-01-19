import { IsString, IsOptional, IsBoolean, IsIn, Length } from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsIn(['VISA', 'MASTERCARD', 'MTN_MOMO', 'VODAFONE_CASH', 'AIRTELTIGO'])
    type: string;

    @IsString()
    @Length(4, 4)
    last4: string;

    @IsOptional()
    @IsString()
    @Length(5, 7)
    expiry?: string;

    @IsString()
    @Length(1, 255)
    holderName: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    isMobileMoney?: boolean;
}

export class UpdatePaymentMethodDto {
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}
