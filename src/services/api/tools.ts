export const toolsService = {
  async evaluateAgent(agentEndpoint: string, input: any, headers?: Record<string, string>) {
    const res = await fetch('/api/tools/evaluate-agent', {
      method: 'POST',
      body: JSON.stringify({ agentEndpoint, testCases: [{ input }], headers })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.results[0];
  }
}; 