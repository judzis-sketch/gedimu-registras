"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  reporterName: z.string().min(2, "Vardas turi būti bent 2 simbolių ilgio."),
  reporterEmail: z.string().email("Neteisingas el. pašto formatas."),
  address: z.string().min(5, "Adresas turi būti bent 5 simbolių ilgio."),
  type: z.enum(["electricity", "plumbing", "heating", "general"], {
    required_error: "Prašome pasirinkti gedimo tipą.",
  }),
  description: z.string().min(10, "Aprašymas turi būti bent 10 simbolių ilgio.").max(500, "Aprašymas negali viršyti 500 simbolių."),
});

const faultTypeTranslations: { [key: string]: string } = {
  electricity: "Elektra",
  plumbing: "Santechnika",
  heating: "Šildymas",
  general: "Bendri gedimai",
};


export function ReportFaultForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporterName: "",
      reporterEmail: "",
      address: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Fault reported:", values);
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    toast({
      title: "Užklausa išsiųsta!",
      description: "Jūsų pranešimas apie gedimą buvo sėkmingai užregistruotas.",
      variant: "default",
    });

    form.reset();
    
    setTimeout(() => setIsSuccess(false), 3000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reporterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jūsų vardas</FormLabel>
                <FormControl>
                  <Input placeholder="Vardenis Pavardenis" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reporterEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>El. paštas</FormLabel>
                <FormControl>
                  <Input placeholder="vardas@pavyzdys.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gedimo adresas</FormLabel>
              <FormControl>
                <Input placeholder="Vilniaus g. 1-1, Vilnius" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gedimo tipas</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pasirinkite gedimo tipą" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(faultTypeTranslations).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gedimo aprašymas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Išsamiai aprašykite gedimą..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Siunčiama...
                </>
            ) : isSuccess ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Išsiųsta!
                </>
            ) : (
                "Registruoti gedimą"
            )}
        </Button>
      </form>
    </Form>
  );
}
