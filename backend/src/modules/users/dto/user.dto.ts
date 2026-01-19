import { IsString, IsOptional, IsBoolean, IsIn, Length } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    fullName?: string;

    @IsOptional()
    @IsString()
    @Length(1, 20)
    phoneNumber?: string;
}

export class UpdatePreferencesDto {
    @IsOptional()
    @IsString()
    @IsIn(['GHS', 'USD', 'EUR'])
    currency?: string;

    @IsOptional()
    @IsString()
    @IsIn(['en-US', 'en-UK', 'fr'])
    language?: string;

    @IsOptional()
    @IsBoolean()
    marketingOptIn?: boolean;

    @IsOptional()
    @IsBoolean()
    orderNotifications?: boolean;
}

export class Toggle2FADto {
    @IsBoolean()
    enabled: boolean;
}

export class ChangePasswordDto {
    @IsString()
    @Length(1, 100)
    currentPassword: string;

    @IsString()
    @Length(8, 100)
    newPassword: string;
}

export class DeleteAccountDto {
    @IsString()
    confirmation: string;
}
