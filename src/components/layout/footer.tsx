import { getFooterSections, getSocialLinks, getFooterConfig } from '@/app/actions/footer'
import FooterClient from './footer-client'

export default async function Footer() {
  const sections = await getFooterSections()
  const socialLinks = await getSocialLinks()
  const config = await getFooterConfig()

  return <FooterClient initialSections={sections} initialSocialLinks={socialLinks} initialCopyright={config?.copyrightText} />
}
