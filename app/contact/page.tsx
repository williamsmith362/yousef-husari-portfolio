import SiteHeader from "../../components/site-header";
import ContactLinks from "../../components/contact-links";
import { pageMetadata } from "../../lib/site-metadata";

export const metadata = pageMetadata(
  "Contact — Yousef Husari",
  "Contact Yousef Husari for bespoke clothing, bags and everyday objects. Email by.yousefhusari@gmail.com, or connect on Instagram and TikTok.",
  "/contact",
);

export default function Contact() {
  return <>
    <SiteHeader active="contact" />
    <main className="contact-page contact-icons" aria-label="Contact Yousef Husari">
      <ContactLinks />
    </main>
  </>;
}
