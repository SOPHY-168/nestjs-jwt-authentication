import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token returned by login',
        example: 'your-refresh-token'
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(256)
    refreshToken: string;
}