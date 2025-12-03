import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotAcceptableException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly secretKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hexKey = this.configService.get<string>('CRYPTO_SECRET_KEY');

    if (!hexKey) {
      this.logger.warn(
        '⚠️ CRYPTO_SECRET_KEY not found in environment variables. Generating a temporary key for development.',
      );
      // Generate a temporary key for development
      this.secretKey = crypto.randomBytes(this.KEY_LENGTH);

      // Log the key for development (never do this in production!)
      this.logger.warn(`🔑 Temporary Key: ${this.secretKey.toString('hex')}`);
    } else {
      try {
        this.secretKey = Buffer.from(hexKey, 'hex');

        if (this.secretKey.length !== this.KEY_LENGTH) {
          throw new BadRequestException(
            `Invalid encryption key length. Expected ${this.KEY_LENGTH} bytes (${this.KEY_LENGTH * 2} hex chars), got ${this.secretKey.length} bytes.`,
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(
          'Invalid encryption key format. Must be a valid hex string.',
        );
      }
    }
  }

  //    Encrypt text using AES-256-GCM
  encrypt(text: string): string {
    if (!text || typeof text !== 'string') {
      throw new BadRequestException(
        'Text to encrypt must be a non-empty string',
      );
    }

    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new InternalServerErrorException(
        'Encryption failed. Please try again later.',
      );
    }
  }

  //    Decrypt text using AES-256-GCM
  decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new BadRequestException(
        'Encrypted text must be a non-empty string',
      );
    }

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new BadRequestException(
          'Invalid encrypted text format. Expected format: iv:encrypted:authTag',
        );
      }

      const [ivHex, encrypted, authTagHex] = parts;

      // Validate hex strings
      if (
        !this.isValidHex(ivHex) ||
        !this.isValidHex(encrypted) ||
        !this.isValidHex(authTagHex)
      ) {
        throw new BadRequestException('Invalid hex format in encrypted data');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      if (iv.length !== this.IV_LENGTH) {
        throw new BadRequestException(
          `Invalid IV length. Expected ${this.IV_LENGTH} bytes.`,
        );
      }

      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.secretKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Decryption failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth') || error.message.includes('tag')) {
          throw new NotAcceptableException(
            'Invalid authentication tag. The data may have been tampered with.',
          );
        }
      }

      throw new InternalServerErrorException(
        'Decryption failed. The data may be corrupted or invalid.',
      );
    }
  }

  //    Mask sensitive data for display
  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || typeof cardNumber !== 'string') {
      throw new BadRequestException('Card number must be a non-empty string');
    }

    const cleaned = cardNumber.replace(/\s+/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      throw new BadRequestException('Invalid card number length');
    }

    if (!/^\d+$/.test(cleaned)) {
      throw new BadRequestException('Card number must contain only digits');
    }

    const lastFour = cleaned.slice(-4);
    return `**** **** **** ${lastFour}`;
  }

  maskCVV(cvv: string | number): string {
    if (!cvv) {
      throw new BadRequestException('CVV is required');
    }

    const cvvStr = cvv.toString();
    if (!/^\d{3,4}$/.test(cvvStr)) {
      throw new BadRequestException('CVV must be 3 or 4 digits');
    }

    return '***' + (cvvStr.length === 4 ? '*' : '');
  }

  maskAadhar(aadhar: string): string {
    if (!aadhar || typeof aadhar !== 'string') {
      throw new BadRequestException('Aadhar number must be a non-empty string');
    }

    const cleaned = aadhar.replace(/\s+/g, '');
    if (cleaned.length !== 12) {
      throw new BadRequestException('Aadhar number must be exactly 12 digits');
    }

    if (!/^\d+$/.test(cleaned)) {
      throw new BadRequestException('Aadhar number must contain only digits');
    }

    return `${cleaned.slice(0, 4)} **** ${cleaned.slice(-4)}`;
  }

  maskPAN(pan: string): string {
    if (!pan || typeof pan !== 'string') {
      throw new BadRequestException('PAN must be a non-empty string');
    }

    const cleaned = pan.toUpperCase().replace(/\s+/g, '');
    if (cleaned.length !== 10) {
      throw new BadRequestException('PAN must be exactly 10 characters');
    }

    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleaned)) {
      throw new BadRequestException(
        'Invalid PAN format. Expected format: ABCDE1234F',
      );
    }

    return `${cleaned.slice(0, 2)}****${cleaned.slice(-4)}`;
  }

  maskPhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Phone number must be a non-empty string');
    }

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      throw new BadRequestException('Phone number must be at least 10 digits');
    }

    return `******${cleaned.slice(-4)}`;
  }

  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new BadRequestException(
        'Account number must be a non-empty string',
      );
    }

    const cleaned = accountNumber.replace(/\s+/g, '');
    if (cleaned.length < 9 || cleaned.length > 18) {
      throw new BadRequestException(
        'Account number must be between 9 and 18 digits',
      );
    }

    if (!/^\d+$/.test(cleaned)) {
      throw new BadRequestException('Account number must contain only digits');
    }

    return `****${cleaned.slice(-4)}`;
  }

  //    Hash data using SHA-256
  hashData(data: string): string {
    if (!data || typeof data !== 'string') {
      throw new BadRequestException('Data to hash must be a non-empty string');
    }

    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      this.logger.error('Hashing failed:', error);
      throw new InternalServerErrorException('Hashing failed');
    }
  }

  //    Generate a secure token with encryption
  generateSecureToken(length = 32): {
    token: string;
    tokenHash: string;
    encryptedToken: string;
    expires: Date;
  } {
    if (length < 16 || length > 64) {
      throw new BadRequestException(
        'Token length must be between 16 and 64 bytes',
      );
    }

    try {
      const token = crypto.randomBytes(length).toString('hex');
      const tokenHash = this.hashData(token);
      const encryptedToken = this.encrypt(token);
      const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      return { token, tokenHash, encryptedToken, expires };
    } catch (error) {
      this.logger.error('Token generation failed:', error);
      throw new ServiceUnavailableException(
        'Token generation service unavailable',
      );
    }
  }

  //    Verify and decrypt a secure token
  verifySecureToken(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new BadRequestException(
        'Encrypted token must be a non-empty string',
      );
    }

    try {
      // URL-decode if necessary
      let decodedText = encryptedText;
      if (encryptedText.includes('%')) {
        try {
          decodedText = decodeURIComponent(encryptedText);
        } catch {
          // If URL decoding fails, use original
          decodedText = encryptedText;
        }
      }

      // Extract token from query string if present
      decodedText = decodedText.split('?')[0].split('&')[0];

      return this.decrypt(decodedText);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotAcceptableException
      ) {
        throw error;
      }

      this.logger.error('Token verification failed:', error);
      throw new NotAcceptableException('Invalid or expired token');
    }
  }

  //    Generate HMAC signature
  generateHmacSignature(data: string, secret?: string): string {
    if (!data || typeof data !== 'string') {
      throw new BadRequestException('Data for HMAC must be a non-empty string');
    }

    try {
      const hmacSecret = secret ? Buffer.from(secret, 'hex') : this.secretKey;
      const hmac = crypto.createHmac('sha256', hmacSecret);
      return hmac.update(data).digest('hex');
    } catch (error) {
      this.logger.error('HMAC generation failed:', error);
      throw new InternalServerErrorException('Signature generation failed');
    }
  }

  //    Verify HMAC signature
  verifyHmacSignature(
    data: string,
    signature: string,
    secret?: string,
  ): boolean {
    if (!data || !signature) {
      throw new BadRequestException('Data and signature are required');
    }

    try {
      const expectedSignature = this.generateHmacSignature(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('HMAC verification failed:', error);
      return false;
    }
  }

  //    Generate random bytes
  generateRandomBytes(length: number): string {
    if (length < 8 || length > 1024) {
      throw new BadRequestException('Length must be between 8 and 1024 bytes');
    }

    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      this.logger.error('Random bytes generation failed:', error);
      throw new ServiceUnavailableException(
        'Random generator service unavailable',
      );
    }
  }

  //    Validate if string is valid hex
  private isValidHex(str: string): boolean {
    return /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
  }
}
