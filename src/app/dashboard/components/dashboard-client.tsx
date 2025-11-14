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
import { MoreHorizontal, User, Clock, Info, Mail, MapPin, Loader2, Send, Phone, Edit, Download, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fault, Worker, Status } from "@/lib/types";
import { FaultTypeIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useFaults } from "@/context/faults-context";
import { useWorkers } from "@/context/workers-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { SignaturePad } from "@/components/signature-pad";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";


interface DashboardClientProps {
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

const ActTemplate = ({ fault, assignedWorker, signatureDataUrl, innerRef }: { fault: Fault, assignedWorker: Worker | undefined, signatureDataUrl?: string, innerRef?: React.Ref<HTMLDivElement> }) => {
  const assignedWorkerName = assignedWorker?.name || 'Nenurodytas';
  
  return (
    <div ref={innerRef} className="space-y-4 text-sm bg-white p-6 text-black">
      <p className="font-bold text-center">Uždaroji akcinė bendrovė "Zarasų būstas"</p>
      <h3 className="text-lg font-bold text-center">ATLIKTŲ DARBŲ AKTAS Nr. {fault.id}</h3>
      <div className="flex justify-between">
          <span>{fault.address}</span>
          <span>{format(new Date(fault.updatedAt), 'yyyy-MM-dd')}</span>
      </div>
      <p>
          Šis aktas patvirtina, kad specialistas <span className="font-semibold">{assignedWorkerName}</span> atliko šiuos darbus, susijusius su gedimo pranešimu:
      </p>
      <div className="p-2 border rounded-md bg-gray-100">
          <p className="font-semibold">Registruotas gedimas:</p>
          <p>{fault.description}</p>
      </div>
      <p>
         Užsakovas <span className="font-semibold">{fault.reporterName}</span> patvirtina, kad darbai atlikti kokybiškai, laiku ir pretenzijų dėl atliktų darbų neturi.
      </p>
      <div className="grid grid-cols-2 gap-8 pt-6">
          <div>
              <p className="font-semibold">Vykdytojas:</p>
              <p className="mt-2 font-medium">{assignedWorkerName}</p>
              <p className="mt-8 border-b border-black"></p>
              <p className="text-xs text-center">(parašas, vardas, pavardė)</p>
          </div>
          <div>
               <p className="font-semibold">Užsakovas:</p>
               <p className="mt-2 font-medium">{fault.reporterName}</p>
               {signatureDataUrl ? (
                <img src={signatureDataUrl} width="200" height="100" alt="Kliento parašas" className="mt-2" />
               ) : (
                <p className="mt-8 border-b border-black"></p>
               )}
               <p className="text-xs text-center">(parašas, vardas, pavardė)</p>
          </div>
      </div>
    </div>
  );
};


export function DashboardClient({
  view,
  workerId,
}: DashboardClientProps) {
  const { faults, setFaults } = useFaults();
  const { workers } = useWorkers();
  const { toast } = useToast();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [faultToSign, setFaultToSign] = useState<Fault | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const actTemplateRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });


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
      const workerName = workers.find(w => w.id === workerId)?.name;
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
    if (!currentFault) return;

    if (actTemplateRef.current) {
        const canvas = await html2canvas(actTemplateRef.current, {
            scale: 2,
            useCORS: true,
            onclone: (document) => {
                const signatureImg = document.querySelector('img[alt="Kliento parašas"]') as HTMLImageElement | null;
                if(signatureImg) {
                    signatureImg.src = signatureDataUrl;
                }
            }
        });
        const actHtml = canvas.toDataURL("image/png");
        
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
    }
  };

  const generatePdfBlob = async (fault: Fault): Promise<Blob | null> => {
     // Create a temporary container for rendering the ActTemplate offscreen
    const elementToCapture = document.createElement('div');
    elementToCapture.style.position = 'fixed';
    elementToCapture.style.left = '-9999px';
    elementToCapture.style.width = '800px'; // A reasonable width for A4
    elementToCapture.style.backgroundColor = 'white';
    document.body.appendChild(elementToCapture);

    // This is a trick to render a component into a div for html2canvas
    const actHtml = (
        <ActTemplate 
            fault={fault} 
            assignedWorker={getAssignedWorker(fault)}
            signatureDataUrl={fault.signature}
        />
    );

    // Using a simple ReactDOM render alternative for this case
    // In a full app, you might use createRoot if available/needed
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    
    // We'll use a little hack by creating a temporary element
    // and using html2canvas on it. This is not ideal but avoids complex ReactDOM async issues here.
    const tempActContainer = document.createElement('div');
    tempActContainer.innerHTML = `
        <div class="space-y-4 text-sm bg-white p-6 text-black" style="font-family: sans-serif; width: 800px;">
          <p style="font-weight: bold; text-align: center;">Uždaroji akcinė bendrovė "Zarasų būstas"</p>
          <h3 style="font-size: 1.125rem; font-weight: bold; text-align: center;">ATLIKTŲ DARBŲ AKTAS Nr. ${fault.id}</h3>
          <div style="display: flex; justify-content: space-between;">
              <span>${fault.address}</span>
              <span>${format(new Date(fault.updatedAt), 'yyyy-MM-dd')}</span>
          </div>
          <p>
              Šis aktas patvirtina, kad specialistas <span style="font-weight: 600;">${getAssignedWorker(fault)?.name || 'Nenurodytas'}</span> atliko šiuos darbus, susijusius su gedimo pranešimu:
          </p>
          <div style="padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background-color: #f3f4f6;">
              <p style="font-weight: 600;">Registruotas gedimas:</p>
              <p>${fault.description}</p>
          </div>
          <p>
             Užsakovas <span style="font-weight: 600;">${fault.reporterName}</span> patvirtina, kad darbai atlikti kokybiškai, laiku ir pretenzijų dėl atliktų darbų neturi.
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; padding-top: 1.5rem;">
              <div>
                  <p style="font-weight: 600;">Vykdytojas:</p>
                  <p style="margin-top: 0.5rem; font-weight: 500;">${getAssignedWorker(fault)?.name || 'Nenurodytas'}</p>
                  <p style="margin-top: 2rem; border-bottom: 1px solid black;"></p>
                  <p style="font-size: 0.75rem; text-align: center;">(parašas, vardas, pavardė)</p>
              </div>
              <div>
                   <p style="font-weight: 600;">Užsakovas:</p>
                   <p style="margin-top: 0.5rem; font-weight: 500;">${fault.reporterName}</p>
                   ${fault.signature ? `<img src="${fault.signature}" width="200" height="100" alt="Kliento parašas" style="margin-top: 0.5rem;" />` : '<p style="margin-top: 2rem; border-bottom: 1px solid black;"></p>'}
                   <p style="font-size: 0.75rem; text-align: center;">(parašas, vardas, pavardė)</p>
              </div>
          </div>
        </div>
    `;
    elementToCapture.appendChild(tempActContainer);


    const canvas = await html2canvas(elementToCapture, {
        scale: 2,
        useCORS: true,
    });
     
    document.body.removeChild(elementToCapture);

    try {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let finalHeight = imgHeight;
        let finalWidth = imgWidth;
        
        if (imgHeight > pdfHeight - 20) {
            finalHeight = pdfHeight - 20;
            finalWidth = (canvas.width * finalHeight) / canvas.height;
        }
        
        const x = (pdfWidth - finalWidth) / 2;
        const y = 10;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        return pdf.output('blob');

    } catch (error) {
        console.error("Klaida generuojant PDF:", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Nepavyko sugeneruoti PDF failo."
        });
        return null;
    }
  }

  const handleDownloadAct = async (fault: Fault) => {
    const blob = await generatePdfBlob(fault);
    if(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atliktu-darbu-aktas-${fault.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllActs = async () => {
    setIsDownloadingAll(true);
    toast({
        title: "Pradedamas aktų archyvavimas...",
        description: "Tai gali užtrukti kelias akimirkas. Prašome palaukti."
    });

    const zip = new JSZip();
    const faultsToDownload = displayedFaults;

    for (const fault of faultsToDownload) {
        const blob = await generatePdfBlob(fault);
        if (blob) {
            zip.file(`atliktu-darbu-aktas-${fault.id}.pdf`, blob);
        }
    }

    if (Object.keys(zip.files).length > 0) {
        try {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aktai-${format(new Date(), 'yyyy-MM-dd')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
                title: "Archyvas sėkmingai sukurtas!",
                description: "Pradedamas ZIP failo atsisiuntimas."
            });
        } catch (error) {
            console.error("Klaida kuriant ZIP archyvą:", error);
            toast({
                variant: "destructive",
                title: "Klaida",
                description: "Nepavyko sukurti ZIP failo."
            });
        }
    } else {
        toast({
            variant: "destructive",
            title: "Nėra duomenų atsisiuntimui",
            description: "Pagal pasirinktus filtrus nerasta aktų, kuriuos būtų galima atsisiųsti."
        });
    }

    setIsDownloadingAll(false);
  }


  const getWorkerName = (workerId?: string) => {
    if (!workerId) return <span className="text-muted-foreground">Nepriskirta</span>;
    return workers.find((w) => w.id === workerId)?.name || "Nežinomas";
  };
  
  const getAssignedWorker = (fault: Fault) => {
    return workers.find((w) => w.id === fault.assignedTo);
  }

  const displayedFaults = faults.filter(fault => {
    if (view === 'worker') {
        return fault.assignedTo === workerId && fault.status !== 'completed';
    }

    if (view === 'admin') {
      const statusMatch = statusFilter === 'all' || fault.status === statusFilter;
      const dateMatch = dateRange?.from && dateRange.to 
        ? new Date(fault.createdAt) >= dateRange.from && new Date(fault.createdAt) <= dateRange.to
        : true;
      return statusMatch && dateMatch;
    }

    return false;
  });

  const downloadableActsCount = displayedFaults.length;

  const adminView = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ataskaitos pagal datą</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          {dateRange && <Button variant="outline" onClick={() => setDateRange(undefined)}>Išvalyti</Button>}
           <Button
                onClick={handleDownloadAllActs}
                disabled={isDownloadingAll || downloadableActsCount === 0}
            >
                {isDownloadingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Archive className="mr-2 h-4 w-4" />
                )}
                Atsisiųsti visus aktus ({downloadableActsCount})
            </Button>
        </CardContent>
      </Card>
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
    </div>
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
                  {view === 'worker' ? "Neturite priskirtų užduočių." : "Pagal pasirinktus filtrus gedimų nerasta."}
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
                       {view === 'admin' && (
                        <DropdownMenuItem onClick={() => handleDownloadAct(fault)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Atsisiųsti aktą</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {view === "admin" && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger disabled={isUpdating === fault.id}>
                              <User className="mr-2 h-4 w-4" />
                              <span>Priskirti specialistą</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {workers.map(worker => (
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
                    <h3 className="font-semibold">Atliktų darbų aktas:</h3>
                     <div className="rounded-md border bg-gray-100 dark:bg-gray-800 p-4">
                        <img src={selectedFault.signature} alt="Pasirašytas aktas" />
                    </div>
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
                <div className="border rounded-md">
                   <ActTemplate 
                    fault={faultToSign} 
                    assignedWorker={getAssignedWorker(faultToSign)}
                    innerRef={actTemplateRef} 
                   />
                </div>
                <div>
                  <p className="text-center font-medium mb-2">Užsakovo parašas:</p>
                   <SignaturePad onSave={(signatureDataUrl) => handleSaveSignature(faultToSign.id, signatureDataUrl)} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}

    