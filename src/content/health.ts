export interface HealthStatus {
  extractionBroken: boolean;
  totalCardsFound: number;
  totalParsed: number;
  lastChecked: number;
}

let currentHealth: HealthStatus = {
  extractionBroken: false,
  totalCardsFound: 0,
  totalParsed: 0,
  lastChecked: Date.now()
};

export function getHealthStatus(): HealthStatus {
  return currentHealth;
}

export function evaluateExtractionHealth(
  candidateCount: number,
  parsedCount: number,
  surfaceMode: string
): HealthStatus {
  currentHealth = {
    extractionBroken: surfaceMode === 'full' && candidateCount >= 8 && parsedCount === 0,
    totalCardsFound: candidateCount,
    totalParsed: parsedCount,
    lastChecked: Date.now()
  };

  if (currentHealth.extractionBroken) {
    console.warn(
      `[YFC HEALTH CHECK FAIL-OPEN] ${candidateCount} cards detected on a full surface, but 0 were extractable. Failing open to prevent empty feeds.`
    );
  }

  return currentHealth;
}

export function resetHealth(): void {
  currentHealth = {
    extractionBroken: false,
    totalCardsFound: 0,
    totalParsed: 0,
    lastChecked: Date.now()
  };
}
