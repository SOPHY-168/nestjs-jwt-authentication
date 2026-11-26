import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    description: 'Use this value in the Authorize button as: Bearer <token>',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'Token lifetime in seconds', example: 3600 })
  expires_in: number;
}

export class ProfileResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'admin@gmail.com' })
  email: string;
}
