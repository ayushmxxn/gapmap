/** Typed mock placeholders. No network. Replace with live sources later. */

export interface MockNotice {
  id: string;
  message: string;
}

export const mockNotices: MockNotice[] = [
  { id: "mock-1", message: "Mock mode is on. No live calls are made." },
];
