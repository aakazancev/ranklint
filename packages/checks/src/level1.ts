import type { CheckDefinition } from './define'
import { canonicalRequired } from './checks/canonical/canonical'
import { h1Length, hierarchy, noEmpty, singleH1 } from './checks/headings/headings'
import { viewport, xRobotsConsistent } from './checks/http/http'
import { noMixedContent } from './checks/http/mixed-content'
import { noLocaleLeak } from './checks/i18n/locale-leak'
import { altRequired, dimensionsRequired, noLazyAboveFold } from './checks/images/images'
import { jsonldParseable, jsonldValidSchema } from './checks/jsonld/jsonld'
import { descriptionLength, descriptionRequired } from './checks/meta/description'
import { ogRequired, twitterCard } from './checks/meta/social'
import { titleLength, titleRequired } from './checks/meta/title'

export const level1Checks: CheckDefinition[] = [
  titleRequired,
  titleLength,
  descriptionRequired,
  descriptionLength,
  ogRequired,
  twitterCard,
  canonicalRequired,
  singleH1,
  noEmpty,
  hierarchy,
  h1Length,
  noLocaleLeak,
  jsonldParseable,
  jsonldValidSchema,
  altRequired,
  dimensionsRequired,
  noLazyAboveFold,
  xRobotsConsistent,
  viewport,
  noMixedContent,
]
