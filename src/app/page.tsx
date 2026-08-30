"use client";

import Header from "@/components/provenly/Header";
import Hero from "@/components/provenly/Hero";
import About from "@/components/provenly/About";
import Services from "@/components/provenly/Services";
import Process from "@/components/provenly/Process";
import CaseStudies from "@/components/provenly/CaseStudies";
import Industries from "@/components/provenly/Industries";
import WhyChooseUs from "@/components/provenly/WhyChooseUs";
import Testimonials from "@/components/provenly/Testimonials";
import Blog from "@/components/provenly/Blog";
import CTA from "@/components/provenly/CTA";
import Footer from "@/components/provenly/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Process />
        <CaseStudies />
        <Industries />
        <WhyChooseUs />
        <Testimonials />
        <Blog />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
