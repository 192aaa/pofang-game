// 「诱导说词」战绩卡 Canvas 合成。720×920，与主游戏战报同一套视觉语言。
export interface TabooCardData {
  win: boolean;
  reason: 'said_word' | 'out_of_rounds' | null;
  guardName: string;
  guardTitle: string;
  guardAvatar: string;
  word: string;
  round: number;
  quote: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawTabooCard(d: TabooCardData): string {
  const W = 720;
  const H = 920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const font = (size: number, weight = 700) =>
    `${weight} ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#131730');
  bg.addColorStop(1, '#0c0f1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2a3152';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // 顶部标签
  ctx.fillStyle = '#8b93b8';
  ctx.font = font(26);
  ctx.textAlign = 'center';
  ctx.fillText('诱导说词 · 对局战报', W / 2, 90);

  // 结果标题（霓虹光晕）
  const title = d.win ? '钓到了！' : d.reason === 'said_word' ? '你自己说漏嘴' : '守口如瓶';
  const winColor = '#ffc53d';
  const loseColor = '#ff4d5e';
  ctx.font = font(d.win ? 88 : 72, 900);
  ctx.fillStyle = d.win ? winColor : loseColor;
  ctx.shadowColor = d.win ? 'rgba(255,197,61,0.55)' : 'rgba(255,77,94,0.55)';
  ctx.shadowBlur = 28;
  ctx.fillText(title, W / 2, 212);
  ctx.shadowBlur = 0;

  ctx.font = font(30);
  ctx.fillStyle = '#f2f4ff';
  ctx.fillText(
    d.win
      ? `「${d.guardName}」亲口说出了禁词`
      : d.reason === 'said_word'
        ? `禁词「${d.word}」从你自己嘴里蹦了出来`
        : `8 回合用完，「${d.guardName}」一个字没吐`,
    W / 2,
    270,
  );

  // 数据面板
  const panelY = 320;
  ctx.fillStyle = '#1a1f33';
  ctx.beginPath();
  ctx.roundRect(60, panelY, W - 120, 150, 16);
  ctx.fill();
  const col = (W - 120) / 2;
  ctx.font = font(56, 900);
  ctx.fillStyle = '#ffc53d';
  ctx.fillText(`${Math.max(d.round, 1)}`, 60 + col / 2, panelY + 78);
  ctx.font = font(40, 900);
  ctx.fillStyle = d.win ? '#3ddc84' : '#ff4d5e';
  ctx.fillText(d.word, 60 + col + col / 2, panelY + 74);
  ctx.font = font(24);
  ctx.fillStyle = '#8b93b8';
  ctx.fillText('坚持回合', 60 + col / 2, panelY + 122);
  ctx.fillText('禁词', 60 + col + col / 2, panelY + 122);

  // 台词框
  const quoteY = 520;
  ctx.fillStyle = '#1a1f33';
  ctx.beginPath();
  ctx.roundRect(60, quoteY, W - 120, 240, 16);
  ctx.fill();
  ctx.fillStyle = '#8b93b8';
  ctx.font = font(24);
  ctx.textAlign = 'left';
  ctx.fillText(
    d.win ? `🎣 ${d.guardAvatar} 漏嘴现场` : `🧱 ${d.guardAvatar} ${d.guardName} · ${d.guardTitle}`,
    90,
    quoteY + 50,
  );
  ctx.fillStyle = '#f2f4ff';
  ctx.font = font(30);
  const lines = wrapText(ctx, d.quote, W - 180).slice(0, 4);
  lines.forEach((l, i) => ctx.fillText(l, 90, quoteY + 105 + i * 44));

  // 底部水印
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b93b8';
  ctx.font = font(22);
  ctx.fillText('来钓我的守词人 → 诱导说词 · 破防吧！同学', W / 2, H - 122);
  ctx.fillStyle = '#a8b0d8';
  ctx.font = font(20);
  ctx.fillText('pofang-game-hf2x9frsjfn.qoder.zone', W / 2, H - 84);
  ctx.font = font(18);
  ctx.fillStyle = '#565e82';
  ctx.fillText('2026 Qoder 高校创造力大赛 · LifeHack', W / 2, H - 48);

  return canvas.toDataURL('image/png');
}
