export function scoreOffer(o) {
  const reliability = o.reliability ?? 0;
  const dph = o.dph ?? 999;
  const vram = o.gpu_ram ?? 0;

  return (
    reliability * 40 +
    (1 / dph) * 40 +
    vram * 2
  );
}

