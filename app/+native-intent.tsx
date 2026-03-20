// Expo Router native intent handler - required for deep linking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function redirectSystemPath({
  path: _path,
  initial: _initial,
}: { path: string; initial: boolean }) {
  // Default redirect to home - customize based on path if needed
  return '/';
}
