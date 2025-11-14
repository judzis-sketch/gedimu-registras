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
import { useFaults } from "@/context/faults-context";
import { FaultType, NewFaultData } from "@/lib/types";

const phoneRegex = new RegExp(
  /^(\+370|8)[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{3})$/
);

const formSchema = z.object({
  reporterName: z.string().min(2, { message: "Vardas turi būti bent 2 simbolių ilgio." }),
  reporterEmail: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  reporterPhone: z.string().regex(phoneRegex, 'Neteisingas telefono numerio formatas. Pvz: +37061234567 arba 861234567'),
  address: z.string().min(5, { message: "Adresas turi būti bent 5 simbolių ilgio." }),
  type: z.enum(["electricity", "plumbing", "heating", "general"], {
    errorMap: () => ({ message: "Prašome pasirinkti gedimo tipą." }),
  }),
  description: z.string().min(10, { message: "Aprašymas turi būti bent 10 simbolių ilgio." }).max(500, { message: "Aprašymas negali viršyti 500 simbolių." }),
});

const faultTypeTranslations: Record<FaultType, string> = {
  electricity: "Elektra",
  plumbing: "Santechnika",
  heating: "Šildymas",
  general: "Bendri gedimai",
};

export function ReportFaultForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addFault } = useFaults();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporterName: "",
      reporterEmail: "",
      reporterPhone: "",
      address: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addFault(values as NewFaultData);
    
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
            name="reporterPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono numeris</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+37061234567"
                    {...field}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9+()-\s]/g, "");
                      field.onChange(target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    {(Object.keys(faultTypeTranslations) as FaultType[]).map((key) => (
                        <SelectItem key={key} value={key}>{faultTypeTranslations[key]}</SelectItem>
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
