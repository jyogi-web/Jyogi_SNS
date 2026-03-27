export interface TutorialStep {
  title: string;
  description: string;
}

export interface TutorialFeature {
  id: string;
  title: string;
  emoji: string;
  shortDescription: string;
  path: string;
  category: "basic" | "feature";
  steps: TutorialStep[];
}
