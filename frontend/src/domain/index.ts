import { learningDomain } from "@/domain/domains/learning";
import type { DomainConfig } from "@/domain/types";

const domainRegistry: Record<string, DomainConfig> = {
  [learningDomain.id]: learningDomain,
};

const configuredDomain = (import.meta.env.VITE_ACTIVE_DOMAIN as
  | string
  | undefined)
  ?.trim()
  .toLowerCase();

export const activeDomain =
  domainRegistry[configuredDomain ?? learningDomain.id] ?? learningDomain;

export { domainRegistry };
export type { DomainConfig, DomainNavigationItem } from "@/domain/types";
