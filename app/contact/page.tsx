import SiteHeader from "../../components/site-header";
import ContactLinks from "../../components/contact-links";

export const metadata = { title: "Contact — Yousef Husari" };

export default function Contact() {
  return <>
    <SiteHeader active="contact" />
    <main className="contact-page contact-icons" aria-label="Contact Yousef Husari">
      <ContactLinks />
    </main>
  </>;
}
