import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import { CheckCircle, Send, Wrench } from "lucide-react";
import { ReportFaultWrapper } from "@/components/report-fault-wrapper";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section id="report" className="w-full py-12 md:py-20 lg:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Kaip tai veikia?
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                  Trijų žingsnių procesas
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Mūsų platforma sukurta taip, kad gedimų registravimas būtų kuo
                  paprastesnis.
                </p>
                <ul className="grid gap-6 mt-6">
                  <li className="flex items-start gap-4">
                    <div className="bg-primary/20 text-primary p-3 rounded-full">
                      <Send className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline">
                        1. Praneškite apie problemą
                      </h3>
                      <p className="text-muted-foreground">
                        Užpildykite formą, pateikdami visą reikiamą informaciją
                        apie gedimą ar kitą problemą.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-primary/20 text-primary p-3 rounded-full">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline">
                        2. Paskiriame atsakingą asmenį
                      </h3>
                      <p className="text-muted-foreground">
                        Administratorius įvertins užklausą ir priskirs ją
                        tinkamam specialistui.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-primary/20 text-primary p-3 rounded-full">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline">
                        3. Problema išspręsta!
                      </h3>
                      <p className="text-muted-foreground">
                        Specialistas sutvarkys gedimą ir pažymės sistemoje, kad
                        darbas baigtas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">
                      Pranešti apie gedimą
                    </CardTitle>
                    <CardDescription>
                      Užpildykite žemiau esančią formą ir mes kuo greičiau
                      reaguosime.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReportFaultWrapper />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gedimų Registras. Visos teisės saugomos.</p>
        </div>
      </footer>
    </div>
  );
}
