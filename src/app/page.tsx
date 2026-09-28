import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { Night } from "@/components/sections/Night";
import { Build } from "@/components/sections/Build";
import { Process } from "@/components/sections/Process";
import { About } from "@/components/sections/About";
import { Contact, Footer } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="content">
        <Hero />
        <Night />
        <Build />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
