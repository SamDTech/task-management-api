import { EntityRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AuthCredentialDto } from './dto/auth-credentials.dto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialDto: AuthCredentialDto): Promise<void> {
    const { username, password } = authCredentialDto;

    const hashedPassword = await this.hashPassword(password);

    const user = new User();
    user.username = username;
    user.password = hashedPassword;

    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('username already exist');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(
    authCredentialDto: AuthCredentialDto,
  ): Promise<string> {
    const { username, password } = authCredentialDto;

    const user = await this.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user.username;
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch (err) {
      console.log(err);
    }
  }
}
