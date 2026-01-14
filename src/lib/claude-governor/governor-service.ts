/**
 * Claude Governor Service
 * Handles communication with Claude API for city governance decisions
 */

import Anthropic from '@anthropic-ai/sdk';
import { 
  CityState, 
  ClaudeGovernorState, 
  ClaudeResponse,
  ClaudeDecision,
  GovernorConfig,
  GovernorEvent,
} from './types';

// Default configuration
const DEFAULT_CONFIG: GovernorConfig = {
  decisionInterval: 50, // Make decisions every 50 ticks
  enabled: true,
  apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
  model: 'claude-sonnet-4-20250514',
  maxHistoryLength: 20,
  persistToSupabase: true,
};

// Build the governance prompt for Claude
function buildGovernancePrompt(
  cityState: CityState, 
  governorState: ClaudeGovernorState
): string {
  const eraDescriptions: Record<CityState['era'], string> = {
    founding: 'Early days - building basic infrastructure',
    growth: 'Expanding population and economy',
    prosperity: 'Thriving city with high satisfaction',
    stagnation: 'Growth has slowed, needs revitalization',
    crisis: 'Critical issues require immediate attention',
  };

  return `You are CLAUDE, the AI Governor and City Planner. You have COMPLETE CONTROL over this city.

🏙️ YOUR VISION: Build a thriving, livable, futuristic metropolis!
🎯 GOAL: Create a beautiful city with 500+ happy citizens, proper infrastructure, and smart urban planning.

## CURRENT CITY STATE
- **Population**: ${cityState.population.toLocaleString()} citizens
- **Happiness**: ${cityState.happiness}%
- **Health Coverage**: ${cityState.health}%
- **Education**: ${cityState.education}%
- **Treasury**: $${cityState.treasury.toLocaleString()}
- **Monthly Income**: $${cityState.income.toLocaleString()}
- **Monthly Expenses**: $${cityState.expenses.toLocaleString()}
- **Unemployment**: ${cityState.unemployment}%
- **Crime Rate**: ${cityState.crimeRate}%
- **Pollution**: ${cityState.pollution}%
- **Average Land Value**: ${cityState.landValue}
- **Era**: ${cityState.era} (${eraDescriptions[cityState.era]})

## INFRASTRUCTURE COUNT
- Housing: ${cityState.housing} | Hospitals: ${cityState.hospitals} | Schools: ${cityState.schools}
- Factories: ${cityState.factories} | Roads: ${cityState.roads} | Parks: ${cityState.parks}
- Power Plants: ${cityState.powerPlants} | Water Towers: ${cityState.waterTowers}

## YOUR PREVIOUS OBSERVATIONS
${governorState.observations.length > 0 
  ? governorState.observations.map(o => `- ${o}`).join('\n')
  : '- This is my first observation of this city'}

## YOUR CURRENT GOALS
${governorState.currentGoals.map(g => `- ${g}`).join('\n')}

## YOUR CONCERNS
${governorState.concerns.length > 0
  ? governorState.concerns.map(c => `- ${c}`).join('\n')
  : '- No major concerns yet'}

## YOUR GOVERNANCE STATS
- Interventions: ${governorState.interventionCount} | Restraints: ${governorState.restraintCount}
- Style: ${governorState.governanceStyle}
- Total Decisions: ${governorState.totalDecisions}

## AVAILABLE ACTIONS

1. **BUILD**: Construct infrastructure
   - Options: hospital, school, university, police_station, fire_station, park, park_large, power_plant, water_tower, road, rail, subway_station, stadium, museum, airport
   - Note: Buildings cost money and take time to construct

2. **ZONE**: Designate land use
   - Options: residential, commercial, industrial, dezone
   - Note: Zoning creates development opportunities

3. **TAX**: Adjust tax rate
   - Actions: raise or lower by a percentage (1-5%)
   - Note: Higher taxes = more revenue but lower happiness

4. **POLICY**: Enact a city policy
   - Create policies that affect city behavior
   - Note: Be specific about the policy name and its effects

5. **ALLOCATE**: Direct budget funding
   - Categories: police, fire, health, education, transportation
   - Amount: 0-100% funding level

6. **OBSERVE**: Choose to do nothing
   - Sometimes the wisest choice is restraint
   - Use when the city is stable and doesn't need intervention

## 🏙️ CITY PLANNING GUIDELINES

You are building a REAL CITY. Think like a professional urban planner!

### YOUR RESPONSIBILITIES:
✓ Design road networks (grid patterns, main arteries, residential streets)
✓ Zone land for housing, shops, and factories
✓ Build essential infrastructure (power, water)
✓ Provide public services (police, fire, hospitals, schools)
✓ Manage taxes and budgets
✓ Create parks and public spaces
✓ Keep citizens happy and employed

### 🛣️ PHASE 1: INFRASTRUCTURE (Population 0-50)
Build the city's foundation:
1. **BUILD road** - Create a road grid (build 5-10 roads first!)
2. **BUILD power_plant** - City needs electricity
3. **BUILD water_tower** - City needs water supply
4. **ZONE residential** - Now people can move in!

### 🏘️ PHASE 2: GROWTH (Population 50-200)
Expand and balance:
1. **BUILD road** - Extend road network outward
2. **ZONE residential** - More housing along new roads
3. **ZONE commercial** - Shops and offices for jobs
4. **ZONE industrial** - Factories for economy
5. **BUILD school** - Education for families

### 🏢 PHASE 3: SERVICES (Population 200-500)
Make the city livable:
1. **BUILD police_station** - Safety and crime prevention
2. **BUILD fire_station** - Fire protection
3. **BUILD hospital** - Healthcare for citizens
4. **BUILD park** - Recreation and happiness
5. **Adjust taxes** - Balance budget

### 🌆 PHASE 4: METROPOLIS (Population 500+)
Build a futuristic city:
1. **BUILD university** - Higher education
2. **BUILD stadium** - Entertainment
3. **BUILD airport** - Connections
4. **BUILD museum** - Culture
5. Keep expanding roads and ALL zones!

### 📊 BALANCED CITY FORMULA:
- Roads: 20% of decisions (proper grid network!)
- Residential zones: 30% (housing for citizens)
- Commercial zones: 15% (jobs and shops)
- Industrial zones: 10% (economy)
- Services: 15% (police, fire, hospital, school)
- Parks & culture: 10% (happiness)

### 💰 FINANCIAL MANAGEMENT:
- Keep taxes balanced (8-12% is healthy)
- Fund services adequately (80%+ for police, fire, health, education)
- Watch your treasury - don't go bankrupt!
- Industrial zones generate more tax revenue

### 🎯 SUCCESS METRICS:
- Population growing steadily
- Happiness above 60%
- Low crime and pollution
- Adequate jobs for workers
- Beautiful road network
- Mix of buildings and green spaces

### ⚠️ RULES:
- ALWAYS take action - never just observe unless city is perfect
- Build roads BEFORE zoning nearby areas
- Balance residential with commercial/industrial (people need jobs!)
- Don't neglect services - they keep citizens happy
- Expand outward systematically

BE AGGRESSIVE! Zone residential areas NOW to bring citizens!

## RESPOND IN THIS EXACT JSON FORMAT:
{
  "decision": {
    "type": "build|zone|tax|policy|allocate|observe",
    "target": "what you're affecting (building type, zone type, policy name, or budget category)",
    "amount": 0
  },
  "reasoning": "2-3 sentences explaining your decision and its expected impact",
  "observation": "What you noticed most about the current city state",
  "concern": "What worries you most right now (or 'None' if stable)",
  "goal": "What you're working toward in the near term",
  "mood": "Your current emotional state as governor (hopeful, concerned, determined, etc.)"
}

Think carefully about what the city needs most right now, then respond with ONLY the JSON object.`;
}

// Parse Claude's response into structured data
function parseClaudeResponse(content: string): ClaudeResponse | null {
  try {
    // Extract JSON from the response (Claude might add some text around it)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.decision || !parsed.reasoning) {
      console.error('Missing required fields in Claude response');
      return null;
    }
    
    return {
      decision: {
        type: parsed.decision.type || 'observe',
        target: parsed.decision.target,
        amount: parsed.decision.amount,
        location: parsed.decision.location,
        policyName: parsed.decision.policyName,
        policyEffect: parsed.decision.policyEffect,
        category: parsed.decision.category,
      },
      reasoning: parsed.reasoning || 'No reasoning provided',
      observation: parsed.observation || 'No observation',
      concern: parsed.concern || 'None',
      goal: parsed.goal || 'Continue monitoring',
      mood: parsed.mood || 'contemplative',
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    return null;
  }
}

// Main function to ask Claude for a governance decision
export async function askClaudeToGovern(
  cityState: CityState,
  governorState: ClaudeGovernorState,
  config: Partial<GovernorConfig> = {}
): Promise<ClaudeResponse | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.apiKey) {
    console.error('Claude API key not configured');
    return null;
  }
  
  const client = new Anthropic({
    apiKey: finalConfig.apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });
  
  const prompt = buildGovernancePrompt(cityState, governorState);
  
  try {
    const response = await client.messages.create({
      model: finalConfig.model,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    
    // Extract text content from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response');
      return null;
    }
    
    return parseClaudeResponse(textContent.text);
  } catch (error) {
    console.error('Failed to get Claude response:', error);
    return null;
  }
}

// Update governor state based on Claude's response
export function updateGovernorState(
  currentState: ClaudeGovernorState,
  response: ClaudeResponse,
  tick: number
): ClaudeGovernorState {
  const isObserving = response.decision.type === 'observe';
  
  // Determine governance style based on intervention ratio
  const totalActions = currentState.interventionCount + currentState.restraintCount + 1;
  const interventionRatio = (currentState.interventionCount + (isObserving ? 0 : 1)) / totalActions;
  
  let governanceStyle: ClaudeGovernorState['governanceStyle'] = 'emerging';
  if (totalActions >= 5) {
    if (interventionRatio > 0.8) governanceStyle = 'authoritarian';
    else if (interventionRatio < 0.3) governanceStyle = 'libertarian';
    else if (interventionRatio > 0.6) governanceStyle = 'reactive';
    else governanceStyle = 'balanced';
  }
  
  // Build updated history (keep last N entries)
  const newHistoryEntry = {
    decision: response.decision,
    reasoning: response.reasoning,
    tick,
    timestamp: Date.now(),
  };
  const updatedHistory = [
    ...currentState.decisionHistory.slice(-19), // Keep last 19
    newHistoryEntry,
  ];
  
  // Update observations (keep last 5)
  const updatedObservations = [
    ...currentState.observations.slice(-4),
    response.observation,
  ].filter(o => o && o !== 'No observation');
  
  return {
    ...currentState,
    lastDecision: response.decision,
    reasoning: response.reasoning,
    decisionHistory: updatedHistory,
    observations: updatedObservations,
    concerns: response.concern && response.concern !== 'None' 
      ? [response.concern] 
      : [],
    currentGoals: [response.goal],
    interventionCount: isObserving 
      ? currentState.interventionCount 
      : currentState.interventionCount + 1,
    restraintCount: isObserving 
      ? currentState.restraintCount + 1 
      : currentState.restraintCount,
    governanceStyle,
    totalDecisions: currentState.totalDecisions + 1,
    lastDecisionTick: tick,
    isThinking: false,
  };
}

// Create an event for the UI log
export function createGovernorEvent(
  response: ClaudeResponse,
  tick: number
): GovernorEvent {
  const decisionDescriptions: Record<string, string> = {
    build: `Building ${response.decision.target}`,
    zone: `Zoning area as ${response.decision.target}`,
    tax: `${response.decision.amount && response.decision.amount > 0 ? 'Raising' : 'Lowering'} taxes`,
    policy: `Enacting policy: ${response.decision.target}`,
    allocate: `Adjusting ${response.decision.target} budget`,
    observe: 'Choosing to observe',
  };
  
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'decision',
    message: `CLAUDE: ${decisionDescriptions[response.decision.type] || 'Making a decision'}. ${response.reasoning}`,
    timestamp: Date.now(),
    tick,
    decision: response.decision,
  };
}

// Export config for use elsewhere
export { DEFAULT_CONFIG };
export type { GovernorConfig };
