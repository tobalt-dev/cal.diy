import parser from "accept-language-parser";
import type { GetServerSidePropsContext, NextApiRequest } from "next";
import { parse as parseUrl } from "url";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

type Maybe<T> = T | null | undefined;

const { i18n } = require("@calcom/i18n/next-i18next.config");

export async function getLocaleFromRequest(
  req: NextApiRequest | GetServerSidePropsContext["req"]
): Promise<string> {
  const session = await getServerSession({ req });
  if (session?.user?.locale) return session.user.locale;

  // Honor explicit URL ?lang= / ?locale= query params so embed config.locale
  // and per-link locale overrides propagate to booking page + attendee.locale.
  // Required for single-language self-hosted instances serving multi-language fleets.
  const url = parseUrl(req.url || "", true);
  const queryLocale = (url.query?.lang || url.query?.locale) as Maybe<string>;
  if (queryLocale && i18n.locales.includes(queryLocale)) {
    return queryLocale;
  }

  let preferredLocale: string | null | undefined;
  if (req.headers["accept-language"]) {
    preferredLocale = parser.pick(i18n.locales, req.headers["accept-language"], {
      loose: true,
    }) as Maybe<string>;
  }
  return preferredLocale ?? i18n.defaultLocale;
}
