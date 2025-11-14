"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Header } from "@/components/header";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("admin");

  const handleLogin = () => {
    if (role === 'worker') {
      router.push(`/dashboard/my-tasks?role=${role}`);
    } else {
      router.push(`/dashboard?role=${role}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Prisijungimas</CardTitle>
            <CardDescription>
              Pasirinkite savo vaidmenį, kad pamatytumėte atitinkamą sąsają.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RadioGroup defaultValue="admin" onValueChange={setRole}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Administratorius</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="worker" id="worker" />
                  <Label htmlFor="worker">Darbuotojas</Label>
                </div>
              </RadioGroup>
              <Button onClick={handleLogin} className="w-full">
                Prisijungti
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
       <footer className="bg-card border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gedimų Registras. Visos teisės saugomos.</p>
        </div>
      </footer>
    </div>
  );
}
