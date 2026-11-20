// 战绩卡 Canvas 合成（AC5）。720×920，深色街机风。
export interface CardData {
  victory: boolean;
  rounds: number;
  hpLeft: number;
  bestHit: { text: string; damage: number } | null;
  bossName: string;
  bossClaim: string;
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

export function drawResultCard(d: CardData): string {
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
  ctx.fillText('破防吧！同学 · 对局战报', W / 2, 90);

  // 结果标题（霓虹光晕）
  ctx.font = font(88, 900);
  ctx.fillStyle = d.victory ? '#ffc53d' : '#ff4d5e';
  ctx.shadowColor = d.victory ? 'rgba(255,197,61,0.55)' : 'rgba(255,77,94,0.55)';
  ctx.shadowBlur = 28;
  ctx.fillText(d.victory ? '破防成功！' : '反被破防…', W / 2, 210);
  ctx.shadowBlur = 0;

  ctx.font = font(30);
  ctx.fillStyle = '#f2f4ff';
  ctx.fillText(
    d.victory
      ? `你说服了「${d.bossName}」`
      : `「${d.bossName}」的嘴硬固若金汤`,
    W / 2,
    268,
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
  ctx.fillText(`${d.rounds}`, 60 + col / 2, panelY + 78);
  ctx.fillStyle = d.victory ? '#3ddc84' : '#ff4d5e';
  ctx.fillText(`${d.hpLeft}`, 60 + col + col / 2, panelY + 78);
  ctx.font = font(24);
  ctx.fillStyle = '#8b93b8';
  ctx.fillText('消耗回合', 60 + col / 2, panelY + 122);
  ctx.fillText('剩余嘴硬值', 60 + col + col / 2, panelY + 122);

  // 金句框
  const quoteY = 520;
  ctx.fillStyle = '#1a1f33';
  ctx.beginPath();
  ctx.roundRect(60, quoteY, W - 120, 240, 16);
  ctx.fill();
  ctx.fillStyle = '#8b93b8';
  ctx.font = font(24);
  ctx.textAlign = 'left';
  ctx.fillText(d.victory ? '⚔️ 致命一击' : '🧱 对方暴论', 90, quoteY + 50);
  if (d.victory && d.bestHit) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffc53d';
    ctx.font = font(34, 900);
    ctx.fillText(`−${d.bestHit.damage}`, W - 90, quoteY + 52);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#f2f4ff';
  ctx.font = font(30);
  const quote = d.victory
    ? d.bestHit?.text ?? '兵不血刃，直接躺赢。'
    : `「${d.bossClaim}」`;
  const lines = wrapText(ctx, quote, W - 180).slice(0, 4);
  lines.forEach((l, i) => ctx.fillText(l, 90, quoteY + 105 + i * 44));

  // 底部水印（AC5.3：站点地址文字水印）
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b93b8';
  ctx.font = font(22);
  ctx.fillText('来挑战我的嘴硬同学 → 破防吧！同学', W / 2, H - 122);
  ctx.fillStyle = '#a8b0d8';
  ctx.font = font(20);
  ctx.fillText('pofang-game-hf2x9frsjfn.qoder.zone', W / 2, H - 84);
  ctx.font = font(18);
  ctx.fillStyle = '#565e82';
  ctx.fillText('2026 Qoder 高校创造力大赛 · LifeHack', W / 2, H - 48);

  return canvas.toDataURL('image/png');
}