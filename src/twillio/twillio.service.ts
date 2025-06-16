import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    this.client = twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN')
    );
  }

  async sendSMS(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        body,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to: to
      });
    } catch (error) {
      throw new Error(`Erreur envoi SMS: ${error.message}`);
    }
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}