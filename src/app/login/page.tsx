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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useAuth, useUser } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@zarasubustas.lt");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState("admin");

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Sėkmingai prisijungėte",
        description: `Sveiki atvykę, ${userCredential.user.email}!`,
      });

      if (role === 'worker') {
         router.push(`/dashboard/my-tasks?role=${role}`);
      } else {
         router.push(`/dashboard?role=${role}`);
      }

    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // If user not found, try to create a new user
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          toast({
            title: "Vartotojas sukurtas ir prijungtas",
            description: `Sveiki atvykę, ${newUserCredential.user.email}!`,
          });
           if (role === 'worker') {
             router.push(`/dashboard/my-tasks?role=${role}`);
          } else {
             router.push(`/dashboard?role=${role}`);
          }
        } catch (signUpError: any) {
          console.error("Sign-up failed:", signUpError);
          toast({
            variant: "destructive",
            title: "Registracijos klaida",
            description: signUpError.message || "Nepavyko sukurti vartotojo.",
          });
        }
      } else {
        console.error("Login failed:", error);
        toast({
          variant: "destructive",
          title: "Prisijungimo klaida",
          description: error.message || "Patikrinkite savo prisijungimo duomenis.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isUserLoading && user) {
        if (email === "admin@zarasubustas.lt") {
            router.push('/dashboard?role=admin');
        } else {
            router.push('/dashboard/my-tasks?role=worker');
        }
    }
  }, [isUserLoading, user, router, email]);


  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (user) {
    // User is logged in, but the redirect in useEffect will handle it
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Tabs defaultValue="admin" className="w-full max-w-sm" onValueChange={(newRole) => {
            setRole(newRole);
            if(newRole === 'admin') {
                setEmail('admin@zarasubustas.lt');
                setPassword('password123');
            } else {
                setEmail('worker@example.com');
                setPassword('password123');
            }
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Administratorius</TabsTrigger>
            <TabsTrigger value="worker">Darbuotojas</TabsTrigger>
          </TabsList>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Prisijungimas</CardTitle>
              <CardDescription>
                Įveskite savo duomenis, kad prisijungtumėte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">El. paštas</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vardas@pavyzdys.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Slaptažodis</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Prisijungti
              </Button>
            </CardContent>
          </Card>
        </Tabs>
      </div>
      <footer className="bg-card border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gedimų Registras. Visos teisės saugomos.</p>
        </div>
      </footer>
    </div>
  );
}
