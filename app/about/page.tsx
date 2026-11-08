import SiteHeader from "../../components/site-header";
import { pageMetadata } from "../../lib/site-metadata";

export const metadata = pageMetadata(
  "About — Yousef Husari",
  "Yousef Husari is a self-taught bespoke designer, creating clothing, bags and everyday objects from fabric to finish, with a focus on heavyweight denim and canvas.",
  "/about",
);

export default function About() {
  return <>
    <SiteHeader active="about" />
    <main className="about-page" aria-label="About Yousef Husari">
      <p>im yousef husari, an 18 year old self taught bespoke designer.</p>
      <p>since i was 16, i have been teaching myself how to produce my own clothing from fabric to finish.</p>
      <p>i design, cut, and sew pants, jackets, hoodies, bags, pouches, totes and everyday items. sky’s the limit.</p>
      <p>i work with an industrial juki 5550n-7, juki w654 mirai, singer hd, an industrial iron, and a japanese grommet press for most of my projects.</p>
      <p>i primarily work with heavy fabrics, around 13-15 oz denim/canvas.</p>
      <p>thank you.</p>
    </main>
  </>;
}
