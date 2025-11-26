import { Logo } from "@/components/ui/logo";
import { AuthForm } from "@/components/auth/auth-form";
import {
  Sparkles,
  FileText,
  Palette,
  Zap,
  Shield,
  Target,
  CheckCircle2,
  BookOpen,
  Layout,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const features = [
    {
      icon: FileText,
      title: "Gerador de PRD Inteligente",
      description:
        "Crie Product Requirement Documents completos e estruturados com a ajuda da IA, economizando horas de trabalho manual.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: BookOpen,
      title: "Documentação de Features",
      description:
        "Gere descrições detalhadas de funcionalidades com especificações técnicas e requisitos de implementação.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Palette,
      title: "UI/UX Designer",
      description:
        "Crie sistemas de design completos com teoria das cores, psicologia visual e guias de estilo profissionais.",
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: Layout,
      title: "Gerenciamento de Projetos",
      description:
        "Organize todos os seus projetos e documentações em um único lugar, com acesso rápido e fácil.",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: Zap,
      title: "Múltiplos Provedores de IA",
      description:
        "Escolha entre diferentes modelos de IA (Gemini, OpenRouter) e configure suas próprias chaves de API.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Shield,
      title: "Seguro e Privado",
      description:
        "Seus dados são protegidos com autenticação segura e criptografia de ponta a ponta.",
      color: "from-green-500 to-emerald-600",
    },
  ];

  const benefits = [
    "Economize até 80% do tempo na criação de documentação",
    "Documentos profissionais prontos para apresentação",
    "Consistência e qualidade garantidas pela IA",
    "Interface intuitiva e fácil de usar",
    "Suporte para múltiplos formatos de exportação (Markdown, PDF)",
    "Atualizações e melhorias contínuas",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex justify-center mb-6">
            <Logo size="xl" imageOnly />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 px-4">
            vRita AI
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mb-4 px-4">
            Transforme suas ideias em documentação profissional
          </p>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mb-8 sm:mb-12">
            Gere PRDs estruturados, documentação de features e sistemas de
            design completos com o poder da Inteligência Artificial
          </p>

          {/* CTA Hero */}
          <div className="max-w-md mx-auto px-4">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
              <AuthForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para criar documentação profissional de forma
            rápida e eficiente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-card rounded-xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Por que escolher o vRita AI?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Benefícios reais para seu trabalho diário
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 sm:gap-4 bg-background rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-foreground font-medium">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Target className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-6 text-green-600 dark:text-green-400" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Sobre o Projeto
            </h2>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-6 text-foreground text-base sm:text-lg leading-relaxed">
              <p>
                O <strong className="text-green-600 dark:text-green-400">vRita AI</strong> foi
                criado para revolucionar a forma como você cria documentação de
                produtos. Sabemos que documentar ideias e requisitos pode ser um
                processo demorado e repetitivo, por isso desenvolvemos uma
                solução que combina inteligência artificial com uma interface
                intuitiva.
              </p>

              <p>
                Nossa plataforma utiliza modelos de IA avançados para gerar
                documentação completa e profissional, incluindo Product
                Requirement Documents (PRDs), descrições detalhadas de features
                e sistemas de design completos com teoria das cores aplicada.
              </p>

              <p>Com o vRita AI, você pode:</p>

              <ul className="space-y-3 list-disc list-inside marker:text-green-600 dark:marker:text-green-400 ml-4">
                <li>
                  Transformar ideias simples em documentos profissionais
                  estruturados
                </li>
                <li>
                  Economizar horas de trabalho manual na criação de documentação
                </li>
                <li>
                  Manter consistência e qualidade em todos os seus documentos
                </li>
                <li>Focar no que realmente importa: construir seu produto</li>
              </ul>

              <p>
                Ideal para <strong>product managers</strong>,{" "}
                <strong>desenvolvedores</strong>, <strong>designers</strong> e
                equipes que precisam criar documentação técnica de alta
                qualidade de forma rápida e eficiente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-primary rounded-2xl p-8 sm:p-12 shadow-xl">
            <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-6 text-primary-foreground" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6">
              Pronto para começar?
            </h2>
            <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Faça login com sua conta Google ou use código por email e comece a criar documentação
              profissional em minutos
            </p>
            <div className="bg-card rounded-xl p-6 sm:p-8">
              <AuthForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            © {new Date().getFullYear()} vRita AI. Desenvolvido com ❤️ para
            facilitar sua documentação.
          </p>
        </div>
      </footer>
    </div>
  );
}
