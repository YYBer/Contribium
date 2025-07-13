import { CreateSponsorProfile } from "../pages/CreateSponsorProfile"
import { PostListing } from "./PostListing"
import { ViewSubmissions } from "./ViewSubmission"
import { Zap, Briefcase, Check, Star, Target, TrendingUp } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function OnboardingSteps() {
  return (
    <div className="min-h-screen bg-theme-primary">
      {/* Hero Section */}
      <section className="gradient-sponsor-hero text-white py-20 px-8">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold font-sentient">
              Sponsor Innovation
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Connect with top talent and bring your blockchain projects to life
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 pt-8">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Star className="w-5 h-5" />
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Target className="w-5 h-5" />
              <span>Expert Matching</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span>Proven Results</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 py-16 space-y-20">
        {/* Choose Your Path */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-sponsor-secondary font-sentient">
              Choose Your Path
            </h2>
            <p className="text-xl text-theme-muted max-w-2xl mx-auto">
              Select the engagement model that best fits your project needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="card-sponsor group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-sponsor-primary-light rounded-xl flex items-center justify-center group-hover:bg-sponsor-primary group-hover:text-white transition-all duration-300">
                    <Zap className="w-8 h-8 text-sponsor-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-sponsor-secondary">Bounties</h3>
                    <p className="text-sponsor-primary">Competition-based rewards</p>
                  </div>
                </div>
                
                <p className="text-theme-muted text-lg">
                  Open competitions where multiple contributors compete for your prize pool. Perfect for creative work and innovation challenges.
                </p>
                
                <ul className="space-y-3">
                  {[
                    "Multiple high-quality submissions to choose from",
                    "Cost-effective for marketing and content creation", 
                    "Built-in community engagement and visibility",
                    "Ideal for: Content, Design, Marketing campaigns"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-sponsor-primary flex-shrink-0 mt-0.5" />
                      <span className="text-theme-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="btn-sponsor-primary w-full py-3 text-lg">
                  Start a Bounty
                </Button>
              </CardContent>
            </Card>

            <Card className="card-sponsor group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-sponsor-accent-light rounded-xl flex items-center justify-center group-hover:bg-sponsor-accent group-hover:text-white transition-all duration-300">
                    <Briefcase className="w-8 h-8 text-sponsor-accent group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-sponsor-secondary">Projects</h3>
                    <p className="text-sponsor-accent">1-on-1 collaboration</p>
                  </div>
                </div>
                
                <p className="text-theme-muted text-lg">
                  Direct partnerships with individual experts. Ideal for complex, long-term work requiring close collaboration.
                </p>
                
                <ul className="space-y-3">
                  {[
                    "Dedicated expert focused solely on your project",
                    "Direct communication and iterative development",
                    "Perfect for complex technical requirements",
                    "Ideal for: Development, Consulting, Long-term partnerships"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-sponsor-accent flex-shrink-0 mt-0.5" />
                      <span className="text-theme-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="btn-sponsor-accent w-full py-3 text-lg">
                  Start a Project
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Steps Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-sponsor-secondary font-sentient">
              How It Works
            </h2>
            <p className="text-xl text-theme-muted max-w-2xl mx-auto">
              Start your journey with Contribium in three simple steps
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid grid-cols-[auto,1fr] gap-12 items-start">
              <div className="sticky top-8 space-y-4">
                <div className="w-16 h-16 bg-sponsor-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sponsor-secondary font-sentient">STEP 1</h3>
                  <p className="text-theme-muted">Create a profile</p>
                </div>
              </div>
              <div className="bg-theme-primary rounded-xl border border-sponsor-primary/20 p-8 shadow-lg">
                <CreateSponsorProfile />
              </div>
            </div>

            <div className="grid grid-cols-[auto,1fr] gap-12 items-start">
              <div className="sticky top-8 space-y-4">
                <div className="w-16 h-16 bg-sponsor-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sponsor-secondary font-sentient">STEP 2</h3>
                  <p className="text-theme-muted">Post your listing</p>
                </div>
              </div>
              <div className="bg-theme-primary rounded-xl border border-sponsor-accent/20 p-8 shadow-lg">
                <PostListing />
              </div>
            </div>

            <div className="grid grid-cols-[auto,1fr] gap-12 items-start">
              <div className="sticky top-8 space-y-4">
                <div className="w-16 h-16 bg-sponsor-secondary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sponsor-secondary font-sentient">STEP 3</h3>
                  <p className="text-theme-muted">Get submissions</p>
                </div>
              </div>
              <div className="bg-theme-primary rounded-xl border border-sponsor-secondary/20 p-8 shadow-lg">
                <ViewSubmissions />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-sponsor-secondary font-sentient">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-theme-muted max-w-2xl mx-auto">
              Get answers to common questions about sponsoring on Contribium
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  question: "Who qualifies to be a sponsor?",
                  answer:
                    "Any team or project that is building in the Alephium ecosystem can sponsor a listing on Contribium. Size of the team or operations don't matter — you can be a tokenised project or a small grantee; as long as you are building on the Alephium blockchain, you can add a listing on Contribium.",
                },
                {
                  question: "How much money do I need to put up?",
                  answer:
                    "The minimum budget varies depending on the type of work and complexity. We recommend discussing your specific needs with our team.",
                },
                {
                  question: "Who judges the bounties & projects?",
                  answer:
                    "Bounties are typically judged by the sponsoring team, while projects are directly managed between the sponsor and the selected freelancer.",
                },
                {
                  question: "Are there any hidden costs and charges?",
                  answer:
                    "No, all fees and charges are transparent and discussed upfront before listing your bounty or project.",
                },
                {
                  question: "What can I use Contribium for?",
                  answer:
                    "You can use Contribium for a wide range of tasks including development, design, marketing, content creation, and community management.",
                },
                {
                  question: "I need help with my listing. How can I get in touch?",
                  answer:
                    "Our support team is available to help. You can reach out through our support channels or contact yy@alephium.org.",
                },
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="bg-theme-primary border border-sponsor-primary/20 rounded-lg px-6 data-[state=open]:border-sponsor-primary/40"
                >
                  <AccordionTrigger className="text-sponsor-secondary hover:text-sponsor-primary hover:no-underline font-medium py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-theme-muted pb-6 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  )
}