// MVP analytics: simple console based tracker (extensible vers PostHog, Amplitude, etc.)
// Usage: track('event_name', { optional: 'props' })

export interface AnalyticsEventProps {
  [key: string]: any; // TODO: affiner typage plus tard
}

export type AnalyticsTransport = (
  name: string,
  props?: AnalyticsEventProps
) => void;

let transports: AnalyticsTransport[] = [
  (name, props) => {
    if (process.env.NODE_ENV === "test") return; // silence en test
    console.log("[analytics]", name, props || {});
  },
];

export function addAnalyticsTransport(fn: AnalyticsTransport) {
  transports.push(fn);
}

export function clearAnalyticsTransports() {
  transports = [];
}

export function track(name: string, props?: AnalyticsEventProps) {
  for (const t of transports) {
    try {
      t(name, props);
    } catch {
      // ignorer erreurs transport
    }
  }
}
