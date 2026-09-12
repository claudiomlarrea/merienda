import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyUso, type UsoEvento, type UsoState } from "@/lib/uso";

const MAX_EVENTOS = 40;

function storePath() {
  if (process.env.VERCEL) return "/tmp/merienda-uso.json";
  return path.join(process.cwd(), "data", "uso.json");
}

let writeChain: Promise<void> = Promise.resolve();

async function readState(): Promise<UsoState> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<UsoState>;
    return {
      ...emptyUso(),
      ...parsed,
      paginas: parsed.paginas ?? {},
      eventos: Array.isArray(parsed.eventos) ? parsed.eventos : [],
    };
  } catch {
    return emptyUso();
  }
}

async function writeState(state: UsoState) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(state, null, 2), "utf8");
}

export async function getUso(): Promise<UsoState> {
  return readState();
}

export async function recordUso(input: {
  tipo: "visita" | "descarga";
  path: string;
  nuevoVisitante: boolean;
}): Promise<UsoState> {
  let next = emptyUso();
  writeChain = writeChain.then(async () => {
    const current = await readState();
    const evento: UsoEvento = {
      t: new Date().toISOString(),
      tipo: input.tipo,
      path: input.path,
    };
    next = {
      visitas: current.visitas + (input.tipo === "visita" ? 1 : 0),
      visitantes: current.visitantes + (input.nuevoVisitante ? 1 : 0),
      descargas: current.descargas + (input.tipo === "descarga" ? 1 : 0),
      paginas: { ...current.paginas },
      eventos: [evento, ...current.eventos].slice(0, MAX_EVENTOS),
      actualizado: evento.t,
    };
    if (input.tipo === "visita") {
      next.paginas[input.path] = (next.paginas[input.path] ?? 0) + 1;
    }
    await writeState(next);
  });
  await writeChain;
  return next;
}
