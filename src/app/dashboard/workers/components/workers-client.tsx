"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { useWorkers } from "@/context/workers-context";
import { useToast } from "@/hooks/use-toast";
import { FaultType, NewWorkerData } from "@/lib/types";
import { faultTypeTranslations } from "@/lib/utils";

const workerFormSchema = z.object({
  name: z.string().min(2, { message: "Vardas turi būti bent 2 simbolių ilgio." }),
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(8, { message: "Slaptažodis turi būti bent 8 simbolių ilgio." }),
  specialty: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Reikia pasirinkti bent vieną specializaciją.",
  }),
});

export function WorkersClient() {
  const { workers, addWorker } = useWorkers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof workerFormSchema>>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      specialty: [],
    },
  });

  function onSubmit(data: z.infer<typeof workerFormSchema>) {
    addWorker(data as NewWorkerData);
    toast({
      title: "Darbuotojas pridėtas",
      description: `${data.name} buvo sėkmingai pridėtas prie sistemos.`,
    });
    form.reset();
    setIsDialogOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline">Darbuotojų sąrašas</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Pridėti darbuotoją
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Pridėti naują darbuotoją</DialogTitle>
                    <DialogDescription>
                      Įveskite darbuotojo duomenis ir priskirkite specializacijas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vardas ir Pavardė</FormLabel>
                          <FormControl>
                            <Input placeholder="Jonas Jonaitis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>El. paštas</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jonas@pavyzdys.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slaptažodis</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="specialty"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Specializacijos</FormLabel>
                          </div>
                          {(Object.keys(faultTypeTranslations) as FaultType[]).map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="specialty"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {faultTypeTranslations[item]}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button variant="outline" onClick={() => form.reset()}>Atšaukti</Button>
                    </DialogClose>
                    <Button type="submit">Išsaugoti</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vardas</TableHead>
                <TableHead>El. paštas</TableHead>
                <TableHead>Specializacija</TableHead>
                <TableHead className="text-right">Veiksmai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.id}</TableCell>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {worker.specialty.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {faultTypeTranslations[spec as FaultType]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled>
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Ištrinti</span>
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
