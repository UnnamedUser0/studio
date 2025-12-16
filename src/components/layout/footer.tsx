import { getFooterSections, getSocialLinks, getFooterConfig } from '@/app/actions/footer'
import FooterClient from './footer-client'

import { auth } from '@/lib/auth'

export default async function Footer() {
  const sections = await getFooterSections()
  const socialLinks = await getSocialLinks()
  const config = await getFooterConfig()

  const session = await auth()
  const user = session?.user

  const permissions = (user as any)?.permissions || ""
  const canManageContent = user?.email === "va21070541@bachilleresdesonora.edu.mx" ||
    permissions.split(',').map((p: string) => p.trim()).includes('manage_content')

  return <FooterClient
    initialSections={sections}
    initialSocialLinks={socialLinks}
    initialCopyright={config?.copyrightText}
    initialFooterSize={(config as any)?.footerSize}
    canManageContent={canManageContent}
  />
}
