/** Plain-text SMS recipient. */
export interface SmsRecipient {
  readonly phone: string;
  readonly name?: string;
}
