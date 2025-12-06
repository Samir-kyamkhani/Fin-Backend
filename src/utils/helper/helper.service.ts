import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class HelperService {
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    let ip: string | undefined;

    if (typeof forwarded === 'string') {
      // "123.123.123.123, proxy1, proxy2"
      ip = forwarded.split(',')[0]?.trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    } else {
      ip = '';
    }

    // remove IPv6 prefix "::ffff:"
    if (ip?.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    // filter local & private network IPs
    if (
      !ip ||
      ip === '::1' || // localhost IPv6
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')
    ) {
      return '';
    }

    return ip;
  }
}
