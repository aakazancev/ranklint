import type { RuleRegistryEntry } from '@ranklint/core'
import type { CheckDefinition } from './define'
import { canonicalRequired, canonicalValid } from './checks/canonical/canonical'
import { h1Length, hierarchy, noEmpty, singleH1 } from './checks/headings/headings'
import { hreflangSymmetric, hreflangValidTargets } from './checks/i18n/hreflang'
import { noLocaleLeak } from './checks/i18n/locale-leak'
import { noBroken, noRedirectChain } from './checks/links/links'
import { descriptionLength, descriptionRequired } from './checks/meta/description'
import { titleLength, titleRequired } from './checks/meta/title'
import { robotsEnvPolicy, robotsExpectedDisallow, robotsReachable, robotsSitemapDeclared, robotsZoneNotBlocked } from './checks/robots/robots'

export const allChecks: CheckDefinition[] = [
  titleRequired,
  titleLength,
  descriptionRequired,
  descriptionLength,
  canonicalRequired,
  canonicalValid,
  singleH1,
  noEmpty,
  hierarchy,
  h1Length,
  noBroken,
  noRedirectChain,
  robotsReachable,
  robotsZoneNotBlocked,
  robotsSitemapDeclared,
  robotsEnvPolicy,
  robotsExpectedDisallow,
  hreflangValidTargets,
  hreflangSymmetric,
  noLocaleLeak,
]

export const ruleRegistry = new Map<string, RuleRegistryEntry>(
  allChecks.map(check => [check.id, {
    defaultSeverity: check.severity,
    schema: check.optionsSchema,
  }]),
)

ruleRegistry.set('links:reachable', { defaultSeverity: 'error' })
