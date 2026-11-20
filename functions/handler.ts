// 应用路由：POST → 回合 SSE（mode=taboo 走诱导说词）；GET → 健康检查。
// QCA 凭证只在 turn.ts / taboo.ts 服务端使用。
import { handleTurn } from './turn.ts';
import { handleTaboo } from './taboo.ts';

export async function handler(request: Request): Promise<Response> {
  if (request.method === 'POST') {
    let text: string;
    try {
      text = await request.text();
    } catch {
      return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }
    if (text.length > 65536) {
      return Response.json({ ok: false, error: 'request_too_large' }, { status: 413 });
    }
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    if (body?.mode === 'taboo') return handleTaboo(body);
    // 主游戏回合：把已读取的原始报文交给 handleTurn，避免二次读取流失
    return handleTurn(new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: text,
    }));
  }
  if (request.method === 'GET') {
    return Response.json({ ok: true, service: 'pofang-turn' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json(
    { ok: false, error: 'method_not_allowed' },
    { status: 405, headers: { 'Cache-Control': 'no-store', Allow: 'GET, POST' } },
  );
}
