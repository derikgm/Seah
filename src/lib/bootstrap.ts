import { initDb } from "./db";
import { seedIfEmpty } from "./seed";
import { generateRecurring } from "./recurring";

export interface BootstrapResult {
  generatedRecurring: number;
}

// Run once per app lifetime. Cached so React StrictMode's double-invoked effect
// (dev) can't trigger concurrent seed/generation races.
let bootstrapPromise: Promise<BootstrapResult> | null = null;

function run(): Promise<BootstrapResult> {
  return (async () => {
    await initDb();
    await seedIfEmpty();
    const generatedRecurring = await generateRecurring();
    return { generatedRecurring };
  })();
}

// One-shot app initialization: schema → seed → auto-generate due recurring
// transactions. Safe to call any number of times.
export function bootstrap(): Promise<BootstrapResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = run().catch((error: unknown) => {
      // Allow a retry on the next call if initialization failed.
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}
