"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Clock, Info, Mail, MapPin, Loader2, Send, Phone, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fault, Worker, Status } from "@/lib/types";
import { FaultTypeIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useFaults } from "@/context/faults-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { SignaturePad } from "@/components/signature-pad";

interface DashboardClientProps {
  initialWorkers: Worker[];
  view: "admin" | "worker";
  workerId?: string;
}

const statusConfig: Record<
  Status,
  { label: string; color: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  new: { label: "Naujas", color: "default", className: "bg-blue-500 text-white" },
  assigned: { label: "Priskirtas", color: "secondary", className: "bg-yellow-500 text-white" },
  "in-progress": { label: "Vykdomas", color: "secondary", className: "bg-orange-500 text-white" },
  completed: { label: "Užbaigtas", color: "outline", className: "bg-green-600 text-white" },
};

const FormattedDate = ({ date }: { date: Date | string | undefined }) => {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        if (!date) return;
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        setFormattedDate(format(dateObj, 'yyyy-MM-dd HH:mm', { locale: lt }));
    }, [date]);

    if (!formattedDate) {
        return null;
    }

    return <>{formattedDate}</>;
};

export function DashboardClient({
  initialWorkers,
  view,
  workerId,
}: DashboardClientProps) {
  const { faults, setFaults } = useFaults();
  const { toast } = useToast();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [faultToSign, setFaultToSign] = useState<Fault | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const actTemplateRef = useRef<HTMLDivElement>(null);


  const statusChangeSubMenu = (fault: Fault) => (
    <DropdownMenuSub>
     <DropdownMenuSubTrigger disabled={isUpdating === fault.id}>
       <Clock className="mr-2 h-4 w-4" />
       <span>Keisti būseną</span>
     </DropdownMenuSubTrigger>
     <DropdownMenuSubContent>
         <DropdownMenuItem disabled={fault.status === 'in-progress'} onClick={() => handleUpdateStatus(fault.id, "in-progress")}>
             Vykdomas
         </DropdownMenuItem>
         <DropdownMenuItem disabled={fault.status === 'completed'} onClick={() => handleUpdateStatus(fault.id, "completed")}>
             Užbaigtas
         </DropdownMenuItem>
     </DropdownMenuSubContent>
   </DropdownMenuSub>
 );

 const createMailToAction = (fault: Fault, newStatusLabel: string, assignedWorkerName?: string) => {
  const subject = `Jūsų gedimo pranešimo (ID: ${fault.id}) būsena atnaujinta`;
  let body = `Laba diena, ${fault.reporterName},\n\nInformuojame, kad jūsų gedimo pranešimo (ID: ${fault.id}), adresu ${fault.address}, būsena buvo pakeista į "${newStatusLabel}".\n\n`;

  if (assignedWorkerName) {
    body += `Gedimą tvarkys specialistas: ${assignedWorkerName}.\n\n`;
  }
  
  if (newStatusLabel === 'Užbaigtas') {
      body += `Jūsų pranešta problema buvo išspręsta.\n\n`;
  }

  body += "Pagarbiai,\nGedimų Registras";

  const mailtoLink = `mailto:${fault.reporterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <ToastAction altText="Siųsti pranešimą" asChild>
      <a href={mailtoLink}><Send className="mr-2 h-4 w-4" /> Siųsti pranešimą</a>
    </ToastAction>
  )
};

  const handleAssignWorker = (faultId: string, workerId: string) => {
    setIsUpdating(faultId);
    let updatedFault: Fault | undefined;

    setFaults((prevFaults) =>
      prevFaults.map((fault) => {
        if (fault.id === faultId) {
          updatedFault = { ...fault, assignedTo: workerId, status: "assigned", updatedAt: new Date() };
          return updatedFault;
        }
        return fault;
      })
    );
    
    if (updatedFault) {
      const workerName = initialWorkers.find(w => w.id === workerId)?.name;
      toast({
        title: "Specialistas priskirtas",
        description: "Paruoštas pranešimas vartotojui.",
        action: createMailToAction(updatedFault, statusConfig.assigned.label, workerName)
      });
    }
    
    setIsUpdating(null);
  };

  const handleUpdateStatus = (faultId: string, status: Status) => {
    setIsUpdating(faultId);
    let updatedFault: Fault | undefined;

    setFaults((prevFaults) =>
      prevFaults.map((fault) => {
        if (fault.id === faultId) {
          updatedFault = { ...fault, status: status, updatedAt: new Date() };
          return updatedFault;
        }
        return fault;
      })
    );

     if(updatedFault) {
        toast({
            title: `Būsena pakeista į "${statusConfig[status].label}"`,
            description: "Paruoštas pranešimas vartotojui.",
            action: createMailToAction(updatedFault, statusConfig[status].label)
        });
     }

     setIsUpdating(null);
  };
  
  const handleSaveSignature = async (faultId: string, signatureDataUrl: string) => {
    const currentFault = faults.find(f => f.id === faultId);
    if (!actTemplateRef.current || !currentFault) return;

    // Temporarily append the signature image to get the full HTML
    const signatureImg = document.createElement('img');
    signatureImg.src = signatureDataUrl;
    signatureImg.width = 200;
    signatureImg.height = 100;
    signatureImg.alt = "Kliento parašas";
    signatureImg.style.marginTop = '0.5rem';

    const placeholder = actTemplateRef.current.querySelector('[data-signature-placeholder]');
    placeholder?.appendChild(signatureImg);

    const actHtml = actTemplateRef.current.innerHTML;

    // Clean up the appended image
    if (placeholder) {
      placeholder.innerHTML = '';
    }

    let updatedFault: Fault | undefined;
    setFaults(prevFaults =>
      prevFaults.map(f => {
        if (f.id === faultId) {
          updatedFault = {
              ...f,
              status: "completed",
              signature: actHtml,
              updatedAt: new Date()
            };
          return updatedFault;
        }
        return f;
      })
    );

    setFaultToSign(null);

    if (updatedFault) {
       toast({
         title: "Parašas išsaugotas ir aktas suformuotas!",
         description: `Būsena pakeista į "Užbaigtas".`,
         action: createMailToAction(updatedFault, statusConfig.completed.label),
       });
    }
  };

  const getWorkerName = (workerId?: string) => {
    if (!workerId) return <span className="text-muted-foreground">Nepriskirta</span>;
    return initialWorkers.find((w) => w.id === workerId)?.name || "Nežinomas";
  };
  
  const getAssignedWorker = (fault: Fault) => {
    return initialWorkers.find((w) => w.id === fault.assignedTo);
  }

  const displayedFaults = view === 'admin'
    ? faults.filter(fault => statusFilter === 'all' || fault.status === statusFilter)
    : faults.filter(fault => fault.assignedTo === workerId && fault.status !== 'completed');

  const adminView = (
     <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value as Status | "all")}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Visi</TabsTrigger>
          <TabsTrigger value="new">Nauji</TabsTrigger>
          <TabsTrigger value="assigned">Priskirti</TabsTrigger>
          <TabsTrigger value="in-progress">Vykdomi</TabsTrigger>
          <TabsTrigger value="completed">Užbaigti</TabsTrigger>
        </TabsList>
        <Card>
            <CardHeader>
              <CardTitle className="font-headline">Visi gedimai</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable()}
            </CardContent>
        </Card>
      </Tabs>
  );

  const workerView = (
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Mano aktyvios užduotys</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTable()}
        </CardContent>
      </Card>
  );
  
  function renderTable() {
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Tipas</TableHead>
              <TableHead>Adresas</TableHead>
              {view === 'worker' && <TableHead>Reporteris</TableHead>}
              <TableHead>Būsena</TableHead>
              <TableHead>Priskirta</TableHead>
              <TableHead>Atnaujinta</TableHead>
              <TableHead className="text-right">Veiksmai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedFaults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {view === 'worker' ? "Neturite priskirtų užduočių." : "Pagal pasirinktą filtrą gedimų nerasta."}
                </TableCell>
              </TableRow>
            ) : (
              displayedFaults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell className="font-medium">{fault.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2" title={fault.type}>
                      <FaultTypeIcon type={fault.type} className="h-4 w-4 text-muted-foreground" />
                      <span className="hidden md:inline">{fault.description.substring(0, 30)}...</span>
                  </div>
                </TableCell>
                <TableCell>{fault.address}</TableCell>
                {view === 'worker' && <TableCell>{fault.reporterName}</TableCell>}
                <TableCell>
                  <Badge variant={statusConfig[fault.status].color} className={cn("text-xs font-semibold", statusConfig[fault.status].className)}>
                    {statusConfig[fault.status].label}
                  </Badge>
                </TableCell>
                <TableCell>{getWorkerName(fault.assignedTo)}</TableCell>
                  <TableCell>
                  <FormattedDate date={fault.updatedAt} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating === fault.id}>
                        {isUpdating === fault.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                        <span className="sr-only">Atidaryti meniu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Veiksmai</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedFault(fault)}>
                          <Info className="mr-2 h-4 w-4" />
                          Peržiūrėti informaciją
                      </DropdownMenuItem>
                       <DropdownMenuItem
                        disabled={fault.status === 'new' || fault.status === 'assigned' || !!fault.signature}
                        onClick={() => setFaultToSign(fault)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Pasirašyti aktą</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {view === "admin" && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger disabled={isUpdating === fault.id}>
                              <User className="mr-2 h-4 w-4" />
                              <span>Priskirti specialistą</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {initialWorkers.map(worker => (
                                    <DropdownMenuItem key={worker.id} onClick={() => handleAssignWorker(fault.id, worker.id)}>
                                        {worker.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          {fault.status !== 'completed' && fault.status !== 'new' && statusChangeSubMenu(fault)}
                        </>
                      )}
                        {view === "worker" && fault.status !== 'completed' && statusChangeSubMenu(fault)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
    );
  }

  return (
    <>
      {view === 'admin' ? adminView : workerView}
      
      <Dialog open={!!selectedFault} onOpenChange={(open) => !open && setSelectedFault(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedFault && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline">Gedimo ID: {selectedFault.id}</DialogTitle>
                <DialogDescription>
                  Išsami informacija apie užregistruotą gedimą
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/20 text-primary p-3 rounded-full">
                        <FaultTypeIcon type={selectedFault.type} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Pilnas aprašymas</h3>
                      <p className="text-muted-foreground text-base">{selectedFault.description}</p>
                    </div>
                  </div>

                <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedFault.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedFault.reporterName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedFault.reporterEmail}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedFault.reporterPhone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            Sukurta: <FormattedDate date={selectedFault.createdAt} />
                        </span>
                      </div>
                </div>

                {selectedFault.signature && (
                  <div className="space-y-2 pt-4">
                    <h3 className="font-semibold">Atliktų darbų aktas ir kliento parašas:</h3>
                    <div
                      className="rounded-md border bg-gray-100 dark:bg-gray-800 p-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: selectedFault.signature }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!faultToSign} onOpenChange={(open) => !open && setFaultToSign(null)}>
        <DialogContent className="sm:max-w-2xl">
          {faultToSign && (
            <>
              <DialogHeader>
                <DialogTitle>Atliktų darbų akto pasirašymas</DialogTitle>
                <DialogDescription>
                  Peržiūrėkite atliktus darbus ir pasirašykite žemiau.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6 text-sm">
                <div ref={actTemplateRef} className="space-y-4">
                    <h3 className="text-lg font-bold text-center">ATLIKTŲ DARBŲ AKTAS Nr. {faultToSign.id}</h3>
                    <div className="flex justify-between">
                        <span>{faultToSign.address}</span>
                        <span>{format(new Date(), 'yyyy-MM-dd')}</span>
                    </div>
                    <p>
                        Šis aktas patvirtina, kad specialistas <span className="font-semibold">{getAssignedWorker(faultToSign)?.name || 'Nenurodytas'}</span> atliko šiuos darbus, susijusius su gedimo pranešimu:
                    </p>
                    <div className="p-2 border rounded-md bg-muted/50">
                        <p className="font-semibold">Registruotas gedimas:</p>
                        <p>{faultToSign.description}</p>
                    </div>
                    <p>
                       Užsakovas <span className="font-semibold">{faultToSign.reporterName}</span> patvirtina, kad darbai atlikti kokybiškai, laiku ir pretenzijų dėl atliktų darbų neturi.
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-6">
                        <div>
                            <p className="font-semibold">Vykdytojas:</p>
                            <p className="mt-2 font-medium">{getAssignedWorker(faultToSign)?.name || 'Nenurodytas'}</p>
                            <p className="mt-8 border-b border-foreground/50"></p>
                            <p className="text-xs text-center">(parašas, vardas, pavardė)</p>
                        </div>
                        <div>
                             <p className="font-semibold">Užsakovas:</p>
                             <p className="mt-2 font-medium">{faultToSign.reporterName}</p>
                             <div data-signature-placeholder></div>
                             <p className="mt-8 border-b border-foreground/50"></p>
                             <p className="text-xs text-center">(parašas, vardas, pavardė)</p>
                        </div>
                    </div>
                </div>
                <div>
                  <p className="text-center font-medium mb-2">Užsakovo parašas:</p>
                  <SignaturePad onSave={(signature) => handleSaveSignature(faultToSign.id, signature)} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
