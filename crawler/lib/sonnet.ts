import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function extractDeathSpiralTerms(filingText: string): Promise<any> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: 'Extract from filing. Return JSON only: {isDeathSpiral:boolean,noteHolder:string,principal:number,noFloor:boolean}\n\n' + filingText.substring(0, 5000)
      }]
    });

    return JSON.parse((response.content[0] as any).text);
  } catch (error) {
    return { isDeathSpiral: false };
  }
}
