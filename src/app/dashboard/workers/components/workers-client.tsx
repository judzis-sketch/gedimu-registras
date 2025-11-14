"use client";

import { useState, useEffect } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { useWorkers } from "@/context/workers-context";
import { useToast } from "@/hooks/use-toast";
import { FaultType, NewWorkerData, Worker } from "@/lib/types";
import { faultTypeTranslations } from "@/lib/utils";

const workerFormSchema = z.object({
  name: z.string().min(2, { message: "Vardas turi būti bent 2 simbolių ilgio." }),
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(8, { message: "Slaptažodis turi būti bent 8 simbolių ilgio." }).or(z.literal("")),
  specialty: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Reikia pasirinkti bent vieną specializaciją.",
  }),
});

export function WorkersClient() {
  const { workers, addWorker, updateWorker, deleteWorker } = useWorkers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const form = useForm<z.infer<typeof workerFormSchema>>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      specialty: [],
    },
  });

  useEffect(() => {
    if (editingWorker) {
      form.reset({
        name: editingWorker.name,
        email: editingWorker.email,
        password: "", // Password is not shown for editing
        specialty: editingWorker.specialty,
      });
    } else {
        form.reset({
            name: "",
            email: "",
            password: "",
            specialty: [],
        });
    }
  }, [editingWorker, form]);


  function onSubmit(data: z.infer<typeof workerFormSchema>) {
     const workerData = { ...data };
     if (!workerData.password) {
        delete workerData.password;
     }

    if (editingWorker) {
      updateWorker(editingWorker.id, workerData as Partial<NewWorkerData>);
      toast({
        title: "Darbuotojas atnaujintas",
        description: `${data.name} duomenys buvo sėkmingai atnaujinti.`,
      });
    } else {
      addWorker(data as NewWorkerData);
      toast({
        title: "Darbuotojas pridėtas",
        description: `${data.name} buvo sėkmingai pridėtas prie sistemos.`,
      });
    }
    
    closeDialog();
  }
  
  const handleEditClick = (worker: Worker) => {
    setEditingWorker(worker);
    setIsDialogOpen(true);
  }

  const handleDeleteClick = (workerId: string) => {
    deleteWorker(workerId);
    toast({
        title: "Darbuotojas pašalintas",
        description: `Darbuotojas buvo sėkmingai pašalintas iš sistemos.`,
        variant: "destructive",
      });
  }

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingWorker(null);
    form.reset();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline">Darbuotojų sąrašas</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if(!open) closeDialog();
            else setIsDialogOpen(true);
          }}>
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
                    <DialogTitle>{editingWorker ? 'Redaguoti darbuotoją' : 'Pridėti naują darbuotoją'}</DialogTitle>
                    <DialogDescription>
                      {editingWorker ? 'Pakeiskite darbuotojo duomenis.' : 'Įveskite darbuotojo duomenis ir priskirkite specializacijas.'}
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
                            <Input type="password" placeholder={editingWorker ? 'Palikite tuščią, jei nekeičiate' : ''} {...field} />
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
                                            ? field.onChange([...(field.value || []), item])
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
                       <Button type="button" variant="outline" onClick={closeDialog}>Atšaukti</Button>
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
                    <div className="flex gap-1 flex-wrap">
                      {worker.specialty.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {faultTypeTranslations[spec as FaultType]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(worker)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Redaguoti</span>
                        </Button>

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
                                    Šis veiksmas negrįžtamas. Darbuotojas bus visam laikui pašalintas iš sistemos.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClick(worker.id)}>
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
        </CardContent>
      </Card>
    </>
  );
}
