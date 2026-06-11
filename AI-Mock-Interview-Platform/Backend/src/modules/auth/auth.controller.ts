import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto, ResetPasswordDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto, @Req() req: any) { return this.auth.register(dto, req); }
  @Post('login') login(@Body() dto: LoginDto, @Req() req: any) { return this.auth.login(dto, req); }
  @Post('refresh') refresh(@Body() dto: RefreshDto, @Req() req: any) { return this.auth.refresh(dto.refreshToken, req); }
  @Post('logout') @UseGuards(AuthGuard('jwt')) @ApiBearerAuth() logout(@CurrentUser() user: any, @Body() dto: RefreshDto) { return this.auth.logout(user.sub, dto.refreshToken); }
  @Post('email/verify') verifyEmail(@Body('token') token: string) { return this.auth.verifyEmail(token); }
  @Post('password/forgot') forgot(@Body('email') email: string) { return this.auth.requestPasswordReset(email); }
  @Post('password/reset') reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }
  @Get('google') googleStart() { return { url: '/api/v1/auth/google/callback', note: 'Wire passport-google-oauth20 strategy in production secrets.' }; }
}
