import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalyticsConsent } from './ga4-mp';

export type { AnalyticsConsent } from './ga4-mp';

export const USAGE_ANALYTICS_AVAILABLE = false;
export const GA4_FORWARDED_EVENTS = new Set<string>();

// Metro selects this module for iOS instead of the analytics transport.
export async function getAnalyticsConsent(): Promise<AnalyticsConsent> {
  await AsyncStorage.multiRemove([
    'ga4_mp_client_id',
    'deepbreathing.analytics-consent.v1',
  ]).catch(() => {});
  return 'denied';
}

export async function setAnalyticsConsent(_consent: AnalyticsConsent): Promise<void> {
  await getAnalyticsConsent();
}

export function warmClientId(): void {}

export function fireGA4Event(
  _eventName: string,
  _params: Record<string, unknown>,
): void {}
