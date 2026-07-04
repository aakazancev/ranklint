import type { RuleRegistryEntry } from '@ranklint/core'
import type { CheckDefinition } from './define'
import { canonicalRequired, canonicalValid } from './checks/canonical/canonical'
import { h1Length, hierarchy, noEmpty, singleH1 } from './checks/headings/headings'
import { hreflangSymmetric, hreflangValidTargets } from './checks/i18n/hreflang'
import { noSoft404, ttfbBudget, viewport, xRobotsConsistent } from './checks/http/http'
import { ssrContent } from './checks/indexability/ssr-content'
import { permanentRedirects, trailingSlashConsistent } from './checks/links/redirects'
import { noLocaleLeak } from './checks/i18n/locale-leak'
import { altRequired, dimensionsRequired, noLazyAboveFold } from './checks/images/images'
import { jsonldParseable, jsonldValidSchema } from './checks/jsonld/jsonld'
import { noBroken, noRedirectChain } from './checks/links/links'
import { noOrphans } from './checks/links/orphans'
import { descriptionLength, descriptionRequired } from './checks/meta/description'
import { noDuplicateDescription, noDuplicateTitle, uniqueH1 } from './checks/meta/duplicates'
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
  noDuplicateTitle,
  noDuplicateDescription,
  uniqueH1,
  noOrphans,
  jsonldParseable,
  jsonldValidSchema,
  altRequired,
  dimensionsRequired,
  noLazyAboveFold,
  ssrContent,
  noSoft404,
  xRobotsConsistent,
  ttfbBudget,
  viewport,
  permanentRedirects,
  trailingSlashConsistent,
]

export const ruleRegistry = new Map<string, RuleRegistryEntry>(
  allChecks.map(check => [check.id, {
    defaultSeverity: check.severity,
    schema: check.optionsSchema,
  }]),
)

ruleRegistry.set('links:reachable', { defaultSeverity: 'error' })
