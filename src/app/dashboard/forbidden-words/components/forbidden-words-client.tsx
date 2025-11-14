"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { useForbiddenWords } from "@/context/forbidden-words-context";
import { useToast } from "@/hooks/use-toast";

const wordFormSchema = z.object({
  word: z.string().min(2, { message: "Žodis turi būti bent 2 simbolių ilgio." }).regex(/^[a-zA-ZĄ-ž]+$/, { message: "Žodį gali sudaryti tik raidės." }),
});

export function ForbiddenWordsClient() {
  const { forbiddenWords, addForbiddenWord, deleteForbiddenWord } = useForbiddenWords();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof wordFormSchema>>({
    resolver: zodResolver(wordFormSchema),
    defaultValues: {
      word: "",
    },
  });

  function onSubmit(data: z.infer<typeof wordFormSchema>) {
    if (forbiddenWords.includes(data.word.toLowerCase())) {
        toast({
            title: "Klaida",
            description: `Žodis "${data.word}" jau yra sąraše.`,
            variant: "destructive",
        });
        return;
    }
    addForbiddenWord(data.word);
    toast({
      title: "Žodis pridėtas",
      description: `Žodis "${data.word}" buvo sėkmingai pridėtas.`,
    });
    form.reset();
  }
  
  const handleDeleteClick = (word: string) => {
    deleteForbiddenWord(word);
    toast({
        title: "Žodis pašalintas",
        description: `Žodis "${word}" buvo sėkmingai pašalintas.`,
      });
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Nepageidaujamų žodžių valdymas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                    <FormField
                      control={form.control}
                      name="word"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Įveskite naują žodį..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Pridėti
                    </Button>
                </form>
            </Form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Žodis</TableCell>
                <TableCell className="text-right">Veiksmai</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forbiddenWords.map((word) => (
                <TableRow key={word}>
                  <TableCell>{word}</TableCell>
                   <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Ištrinti</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Ar esate tikri?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Šis veiksmas negrįžtamas. Žodis bus visam laikui pašalintas iš sąrašo.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClick(word)}>
                                    Ištrinti
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {forbiddenWords.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Sąrašas yra tuščias.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
