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
import { useState, useMemo, useCallback } from "react";
import { useFaults } from "@/context/faults-context";
import { useForbiddenWords } from "@/context/forbidden-words-context";
import { FaultType, NewFaultData } from "@/lib/types";
import { faultTypeTranslations } from "@/lib/utils";


export function ReportFaultForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addFault } = useFaults();
  const { forbiddenWords } = useForbiddenWords();

  const formSchema = useMemo(() => z.object({
    reporterName: z.string().min(2, { message: "Vardas turi būti bent 2 simbolių ilgio." }),
    reporterEmail: z.string().email({ message: "Neteisingas el. pašto formatas." }),
    reporterPhone: z.string().length(8, "Telefono numeris turi būti sudarytas iš 8 skaitmenų.").regex(/^\d{8}$/, "Telefono numerį gali sudaryti tik skaitčiai."),
    address: z.string().min(5, { message: "Adresas turi būti bent 5 simbolių ilgio." }),
    type: z.enum(["electricity", "plumbing", "renovation", "general"], {
      errorMap: () => ({ message: "Prašome pasirinkti gedimo tipą." }),
    }),
    description: z.string().min(10, { message: "Aprašymas turi būti bent 10 simbolių ilgio." }).max(500, { message: "Aprašymas negali viršyti 500 simbolių." })
  }), []);

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

  const censorText = useCallback((text: string) => {
    if (!forbiddenWords || forbiddenWords.length === 0) {
        return text;
    }
    const regex = new RegExp(`\\b(${forbiddenWords.join("|")})\\b`, "gi");
    return text.replace(regex, (match) => '*'.repeat(match.length));
  }, [forbiddenWords]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const fullPhoneNumber = `+370${values.reporterPhone}`;
    addFault({ ...values, reporterPhone: fullPhoneNumber });
    
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
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-background text-sm text-muted-foreground">
                      +370
                    </span>
                    <Input
                      type="tel"
                      placeholder="61234567"
                      className="rounded-l-none"
                      maxLength={8}
                      {...field}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[^0-9]/g, "");
                        field.onChange(target.value);
                      }}
                    />
                  </div>
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
                  onChange={(e) => {
                    const censoredValue = censorText(e.target.value);
                    field.onChange(censoredValue);
                  }}
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

    