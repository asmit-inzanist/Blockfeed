import Header from "@/components/Header";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Features = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24">
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Features;


