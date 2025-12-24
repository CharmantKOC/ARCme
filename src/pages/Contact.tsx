import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@arc-memoires.edu",
    description: "Réponse sous 24-48h",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "+33 1 23 45 67 89",
    description: "Lun-Ven, 9h-18h",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "12 Rue de l'Université",
    description: "75007 Paris, France",
  },
  {
    icon: Clock,
    title: "Horaires d'ouverture",
    value: "Lun-Ven: 9h-18h",
    description: "Fermé le week-end",
  },
];

const faqItems = [
  {
    question: "Comment puis-je soumettre mon mémoire ?",
    answer: "Connectez-vous à votre compte étudiant et accédez à la section 'Dépôt'. Suivez les instructions pour téléverser votre document.",
  },
  {
    question: "L'accès à la base de données est-il gratuit ?",
    answer: "Oui, l'accès est gratuit pour tous les étudiants et anciens élèves de l'établissement. Une inscription est requise.",
  },
  {
    question: "Comment contacter un alumni ?",
    answer: "Via la page Alumni, vous pouvez envoyer une demande de contact aux anciens diplômés qui ont activé cette option.",
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Contact</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nous sommes là pour vous aider
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Une question, une suggestion ou besoin d'assistance ? Notre équipe est à votre disposition.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-foreground mb-6">Envoyez-nous un message</h2>
                
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" placeholder="Votre prénom" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" placeholder="Votre nom" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="votre.email@exemple.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un sujet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Question générale</SelectItem>
                        <SelectItem value="technical">Support technique</SelectItem>
                        <SelectItem value="deposit">Dépôt de mémoire</SelectItem>
                        <SelectItem value="alumni">Réseau alumni</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Décrivez votre demande en détail..." 
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <Button variant="hero" size="lg" className="w-full gap-2">
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </Button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info Cards */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="font-semibold text-foreground mb-4">Informations de contact</h3>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        <p className="font-medium text-foreground">{info.value}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="font-semibold text-foreground mb-4">Liens utiles</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Centre d'aide
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Book className="w-4 h-4" />
                    Guide d'utilisation
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MessageSquare className="w-4 h-4" />
                    FAQ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Questions fréquentes</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {faqItems.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-card rounded-xl border border-border p-6 hover:border-primary/20 hover:shadow-medium transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h4 className="font-medium text-foreground mb-2">{item.question}</h4>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
