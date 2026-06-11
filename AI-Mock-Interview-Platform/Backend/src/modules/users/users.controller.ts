import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
@ApiTags('Users') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') me(@CurrentUser() user: any) { return this.users.me(user.sub); }
  @Patch('me/profile') update(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) { return this.users.updateProfile(user.sub, dto); }
  @Get('me/analytics') analytics(@CurrentUser() user: any) { return this.users.analytics(user.sub); }
}
