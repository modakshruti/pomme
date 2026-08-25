import { env } from 'cloudflare:workers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

type TrackerState = {
  water?: number;
  protein?: number;
  calories?: number;
  weight?: string;
  vitamins?: string[];
  foods?: Array<{ name: string; protein: number; calories: number; portion?: string; confidence?: string }>;
};

const dashboardUrl = 'https://steady-glp1-support.modakshruti.chatgpt.site/';

function getUser(request: Request) {
  return request.headers.get('oai-authenticated-user-id') ?? 'chatgpt-plugin-user';
}

async function readState(userId: string, day: string): Promise<TrackerState> {
  const row = await env.DB.prepare('SELECT data_json FROM tracker_state WHERE user_id = ? AND day = ?')
    .bind(userId, day).first<{ data_json: string }>();
  return row ? JSON.parse(row.data_json) : { water: 0, protein: 0, calories: 0, weight: '', vitamins: [], foods: [] };
}

async function writeState(userId: string, day: string, data: TrackerState) {
  await env.DB.prepare(`INSERT INTO tracker_state (user_id, day, data_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, day) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP`)
    .bind(userId, day, JSON.stringify(data)).run();
}

function createServer(request: Request) {
  const userId = getUser(request);
  const server = new McpServer({ name: 'pomme', version: '0.1.0' });

  server.registerTool('get_daily_progress', {
    title: 'Get Pomme daily progress',
    description: 'Read today’s saved protein, calories, hydration, food log, weight, and goals before coaching or logging a meal.',
    inputSchema: { day: z.string().optional().describe('Date in YYYY-MM-DD; defaults to today') },
  }, async ({ day }) => {
    const selectedDay = day ?? new Date().toISOString().slice(0, 10);
    const [data, settings] = await Promise.all([readState(userId, selectedDay), readState(userId, 'settings')]);
    const summary = { day: selectedDay, protein_g: data.protein ?? 0, protein_goal_g: (settings as {proteinGoal?:number}).proteinGoal ?? 90, calories: data.calories ?? 0, calorie_goal: (settings as {calorieGoal?:number}).calorieGoal ?? 1400, water_cups: data.water ?? 0, foods: data.foods ?? [], dashboard_url: dashboardUrl };
    return { content: [{ type: 'text', text: `Pomme progress: ${summary.protein_g}/${summary.protein_goal_g}g protein, ${summary.calories}/${summary.calorie_goal} calories, ${summary.water_cups}/8 cups water.` }, { type: 'resource_link', uri: dashboardUrl, name: 'Open Pomme dashboard', description: 'View the full motivating daily dashboard.' }], structuredContent: summary };
  });

  server.registerTool('log_meal_estimate', {
    title: 'Log an AI-estimated meal',
    description: 'Save a meal only after ChatGPT has inspected the user’s attached photo, estimated each visible item and portion, stated uncertainty, and the user has confirmed the estimate.',
    inputSchema: {
      day: z.string().optional().describe('Date in YYYY-MM-DD; defaults to today'),
      meal_name: z.string().describe('Short meal name'),
      items: z.array(z.object({
        name: z.string(), portion: z.string(), protein_g: z.number().nonnegative(), calories: z.number().nonnegative(), confidence: z.enum(['low','moderate','high'])
      })).min(1),
      notes: z.string().optional(),
    },
  }, async ({ day, meal_name, items, notes }) => {
    const selectedDay = day ?? new Date().toISOString().slice(0, 10);
    const data = await readState(userId, selectedDay);
    const protein = Math.round(items.reduce((sum, item) => sum + item.protein_g, 0));
    const calories = Math.round(items.reduce((sum, item) => sum + item.calories, 0));
    const entry = { name: meal_name, protein, calories, portion: items.map(i => `${i.name}: ${i.portion}`).join('; '), confidence: items.some(i => i.confidence === 'low') ? 'low' : items.some(i => i.confidence === 'moderate') ? 'moderate' : 'high', notes };
    const next = { ...data, protein: (data.protein ?? 0) + protein, calories: (data.calories ?? 0) + calories, foods: [entry, ...(data.foods ?? [])] };
    await writeState(userId, selectedDay, next);
    return { content: [{ type: 'text', text: `Logged ${meal_name}: about ${protein}g protein and ${calories} calories. Daily total is now ${next.protein}g protein.` }, { type: 'resource_link', uri: dashboardUrl, name: 'View updated Pomme dashboard' }], structuredContent: { logged: true, meal_name, items, protein_g: protein, calories, daily_protein_g: next.protein, daily_calories: next.calories, confidence: entry.confidence, dashboard_url: dashboardUrl } };
  });

  server.registerTool('log_water', {
    title: 'Log water',
    description: 'Add cups of water to today’s Pomme hydration total.',
    inputSchema: { cups: z.number().positive().max(8), day: z.string().optional() },
  }, async ({ cups, day }) => {
    const selectedDay = day ?? new Date().toISOString().slice(0, 10);
    const data = await readState(userId, selectedDay);
    const water = Math.min(8, (data.water ?? 0) + cups);
    await writeState(userId, selectedDay, { ...data, water });
    return { content: [{ type: 'text', text: `Hydration updated to ${water}/8 cups.` }], structuredContent: { water_cups: water, goal_cups: 8 } };
  });

  return server;
}

async function handle(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  const server = createServer(request);
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
