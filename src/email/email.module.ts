import { Global, Module } from '@nestjs/common';
import { EMAIL_PROVIDER } from './email.constants';
import { EmailService } from './email.service';
import { resolveEmailProvider } from './providers';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useClass: resolveEmailProvider(process.env.EMAIL_PROVIDER),
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
