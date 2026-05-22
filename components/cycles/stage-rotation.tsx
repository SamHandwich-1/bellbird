// Stage rotation map — editorial narrative for the Cycles page.
//
// These items are placeholders from the v0 mockup. James should review and
// update them to his current rotation view before the page is considered
// done (see Turn 5 verification checklist).
//
// Workflow: edit this file when your view of rotation shifts (quarterly
// cadence). Different from cycle readings — those have an in-UI override.

export type RotationStage = {
  stage: 1 | 2 | 3;
  label: string;                 // "NOW" | "12-18mo" | "24-36mo"
  description: string;           // "Active alpha" | "Setup" | "Recovery rotation"
  items: readonly string[];
};

export const stageRotation: readonly RotationStage[] = [
  {
    stage: 1,
    label: 'NOW',
    description: 'Active alpha',
    items: [
      'Private Credit — Slow Burn',
      'Japan Megabank ROE Repricing',
      'Silver Over Gold',
      'Brand Korea — K-Beauty Cohort',
      'Grid Resilience',
    ],
  },
  {
    stage: 2,
    label: '12-18mo',
    description: 'Setup',
    items: [
      'Uranium — physical tranche entry',
      'AAA Collapse / Platform Compound',
      'Retirement Villages — INA settlement catalyst',
      'Robotaxi & optionality loop',
      'Agent Economy Equity Layer',
    ],
  },
  {
    stage: 3,
    label: '24-36mo',
    description: 'Recovery rotation',
    items: [
      'Copper — phased deployment',
      'Midstream — AI Energy Nexus',
      'China Rare Earth Value Chain',
      'Insurance — AI Eats Labor Cost',
    ],
  },
] as const;
