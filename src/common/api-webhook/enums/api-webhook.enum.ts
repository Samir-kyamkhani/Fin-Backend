export enum WebhookStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

export enum WebhookProvider {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  CASHFREE = 'CASHFREE',
}