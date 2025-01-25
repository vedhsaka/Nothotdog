export interface SavedTest {
  id: string;
  name: string;
  agentEndpoint: string;
  headers: Record<string, string>;
  input?: string;
  expectedOutput?: string;
  rules: any[];
}