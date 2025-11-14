"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  DialogFooter,
  DialogClose,
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
import { MoreHorizontal, User, Clock, Info, Mail, MapPin, Loader2, Send, Phone, Edit, Download, Archive, MessageSquare, AlertCircle, Map, ListTodo, Wrench, CheckCircle, ArrowUp, ArrowDown, PlusCircle } from "lucide-react";
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
import { SignaturePad } from "@/components/signature-pad";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AddFaultDialog } from "./add-fault-dialog";
import { useUser } from "@/firebase";


interface DashboardClientProps {
  view: "admin" | "worker";
}

type SortKey = 'id' | 'description' | 'type' | 'address' | 'status' | 'assignedTo' | 'updatedAt' | 'createdAt';

interface NotificationContent {
    fault: Fault;
    subject: string;
    emailBody: string;
    smsBody: string;
}

const statusConfig: Record<
  Status,
  { label: string; color: "default" | "secondary" | "destructive" | "outline"; className: string, ringClassName: string; icon: React.ElementType }
> = {
  new: { label: "Naujas", color: "default", className: "bg-blue-500 text-white", ringClassName: "ring-blue-500", icon: AlertCircle },
  assigned: { label: "Priskirtas", color: "secondary", className: "bg-yellow-500 text-white", ringClassName: "ring-yellow-500", icon: ListTodo },
  "in-progress": { label: "Vykdomas", color: "secondary", className: "bg-orange-500 text-white", ringClassName: "ring-orange-500", icon: Wrench },
  completed: { label: "Užbaigtas", color: "outline", className: "bg-green-600 text-white", ringClassName: "ring-green-600", icon: CheckCircle },
};

const FormattedDate = ({ date }: { date: any }) => {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        if (!date) return;
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        setFormattedDate(format(dateObj, 'yyyy-MM-dd HH:mm', { locale: lt }));
    }, [date]);

    if (!formattedDate) {
        return <span className="text-muted-foreground">...</span>;
    }

    return <>{formattedDate}</>;
};

const SortableHeader = ({ sortKey: key, children, handleSort, currentSortKey, currentSortDirection }: { sortKey: SortKey, children: React.ReactNode, handleSort: (key: SortKey) => void, currentSortKey: SortKey, currentSortDirection: 'asc' | 'desc' }) => {
    const isActive = currentSortKey === key;
    return (
        <TableHead onClick={() => handleSort(key)} className="cursor-pointer">
        <div className="flex items-center gap-2">
            {children}
            {isActive ? (
                currentSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
            ) : (
                <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
            )}
        </div>
        </TableHead>
    );
};

const ActTemplate = ({ fault, assignedWorker, workerSignatureDataUrl, customerSignatureDataUrl, innerRef }: { fault: Fault, assignedWorker: Worker | undefined, workerSignatureDataUrl?: string, customerSignatureDataUrl?: string, innerRef?: React.Ref<HTMLDivElement> }) => {
  const assignedWorkerName = assignedWorker?.name || 'Nenurodytas';
  
  return (
    <div ref={innerRef} className="space-y-4 text-sm bg-white p-6 text-black">
      <p className="font-bold text-center">Uždaroji akcinė bendrovė "Zarasų būstas"</p>
      <h3 className="text-lg font-bold text-center">ATLIKTŲ DARBŲ AKTAS Nr. {fault.customId}</h3>
      <div className="flex justify-between">
          <span>{fault.address}</span>
          <span>{format(new Date(), 'yyyy-MM-dd')}</span>
      </div>
      <p>
          Šis aktas patvirtina, kad specialistas <span className="font-semibold">{assignedWorkerName}</span> atliko šiuos darbus, susijusius su gedimo pranešimu:
      </p>
      <div className="p-2 border rounded-md bg-gray-100 space-y-1">
          <p><span className="font-semibold">Registruotas gedimas:</span> {fault.description}</p>
          <p><span className="font-semibold">Gavimo data:</span> <FormattedDate date={fault.createdAt} /></p>
          {fault.status === 'completed' && fault.updatedAt && <p><span className="font-semibold">Užbaigimo data:</span> <FormattedDate date={fault.updatedAt} /></p>}
      </div>
      <p>
         Užsakovas <span className="font-semibold">{fault.reporterName}</span> patvirtina, kad darbai atlikti kokybiškai, laiku ir pretenzijų dėl atliktų darbų neturi.
      </p>
      <div className="grid grid-cols-2 gap-8 pt-6">
          <div>
              <p className="font-semibold">Vykdytojas:</p>
              <p className="mt-2 font-medium">{assignedWorkerName}</p>
              {workerSignatureDataUrl ? (
                <img src={workerSignatureDataUrl} width="200" height="100" alt="Vykdytojo parašas" className="mt-2" />
               ) : (
                <p className="mt-8 border-b border-black"></p>
               )}
              <p className="text-xs text-center">(parašas, vardas, pavardė)</p>
          </div>
          <div>
               <p className="font-semibold">Užsakovas:</p>
               <p className="mt-2 font-medium">{fault.reporterName}</p>
               {customerSignatureDataUrl ? (
                <img src={customerSignatureDataUrl} width="200" height="100" alt="Užsakovo parašas" className="mt-2" />
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
}: DashboardClientProps) {
  const { faults, updateFault, isLoading: faultsLoading } = useFaults();
  const { workers, isLoading: workersLoading } = useWorkers();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [faultToSign, setFaultToSign] = useState<{fault: Fault, type: 'worker' | 'customer'} | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const actTemplateRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [notificationContent, setNotificationContent] = useState<NotificationContent | null>(null);
  const [isAddFaultDialogOpen, setIsAddFaultDialogOpen] = useState(false);

  const openNotificationEditor = (fault: Fault, newStatusLabel: string, assignedWorkerName?: string) => {
    const subject = `Jūsų gedimo pranešimo (ID: ${fault.customId}) būsena atnaujinta`;
    let emailBody = `Laba diena, ${fault.reporterName},\n\nInformuojame, kad jūsų gedimo pranešimo (ID: ${fault.customId}), adresu ${fault.address}, būsena buvo pakeista į "${newStatusLabel}".\n\n`;
    let smsBody = `Laba diena, informuojame, kad gedimo ${fault.customId} (${fault.address}) būsena pakeista į "${newStatusLabel}".`;

    if (assignedWorkerName) {
        emailBody += `Gedimą tvarkys specialistas: ${assignedWorkerName}.\n\n`;
        smsBody += ` Priskirtas specialistas: ${assignedWorkerName}.`;
    }
    
    if (newStatusLabel === 'Užbaigtas') {
        emailBody += `Jūsų pranešta problema buvo išspręsta.\n\n`;
        smsBody += ` Problema išspręsta.`;
    }

    emailBody += "Pagarbiai,\nGedimų Registras";
    
    setNotificationContent({
        fault,
        subject,
        emailBody,
        smsBody,
    });
  };

  const handleAssignWorker = (faultId: string, workerId: string) => {
    setIsUpdating(faultId);
    
    const fault = faults?.find(f => f.id === faultId);
    if (!fault) return;

    const updatedFaultData = { assignedTo: workerId, status: "assigned" as Status };
    updateFault(faultId, updatedFaultData);
    
    const workerName = workers?.find(w => w.id === workerId)?.name;
    toast({
      title: "Specialistas priskirtas",
      description: `Specialistas ${workerName} priskirtas gedimui ${fault.customId}.`,
    });
    
    openNotificationEditor({ ...fault, ...updatedFaultData }, statusConfig.assigned.label, workerName);
    
    setIsUpdating(null);
  };

  const handleUpdateStatus = (faultId: string, status: Status) => {
    setIsUpdating(faultId);
    const fault = faults?.find(f => f.id === faultId);
    if (!fault) return;

    const updatedFaultData = { status: status, updatedAt: new Date() };
    updateFault(faultId, updatedFaultData);

    toast({
        title: `Būsena pakeista`,
        description: `Gedimo ${fault.customId} būsena pakeista į "${statusConfig[status].label}".`,
    });
    openNotificationEditor({ ...fault, ...updatedFaultData }, statusConfig[status].label);

    setIsUpdating(null);
  };
  
  const handleSaveWorkerSignature = (faultId: string, signatureDataUrl: string) => {
    updateFault(faultId, { workerSignature: signatureDataUrl });
    setFaultToSign(null);
    toast({
      title: "Darbuotojo parašas išsaugotas!",
      description: "Dabar klientas gali pasirašyti aktą.",
    });
  };

const handleSaveCustomerSignature = async (faultId: string, signatureDataUrl: string) => {
    if (!faults) return;
    const currentFault = faults.find(f => f.id === faultId);
    if (!currentFault || !currentFault.workerSignature) return;

    const tempActContainer = document.createElement('div');
    tempActContainer.style.position = 'absolute';
    tempActContainer.style.left = '-9999px';
    tempActContainer.style.width = '800px';
    document.body.appendChild(tempActContainer);

    const ReactDOMClient = await import('react-dom/client');
    const root = ReactDOMClient.createRoot(tempActContainer);

    const faultWithCompletionStatus = { ...currentFault, status: 'completed' as Status, updatedAt: new Date() };

    root.render(
        <ActTemplate
            fault={faultWithCompletionStatus}
            assignedWorker={getAssignedWorker(currentFault)}
            workerSignatureDataUrl={currentFault.workerSignature}
            customerSignatureDataUrl={signatureDataUrl}
        />
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const canvas = await html2canvas(tempActContainer, {
            scale: 2,
            useCORS: true,
        });
        const actImageUrl = canvas.toDataURL('image/png');

        const updatedFaultData: Partial<Fault> = {
            status: "completed",
            customerSignature: signatureDataUrl,
            actImageUrl: actImageUrl,
            updatedAt: new Date(),
        };
        
        updateFault(faultId, updatedFaultData);
        
        toast({
            title: "Aktas sėkmingai pasirašytas ir suformuotas!",
            description: `Būsena pakeista į "Užbaigtas".`,
        });

        if (view === 'admin') {
             openNotificationEditor({ ...currentFault, ...updatedFaultData }, statusConfig.completed.label);
        }

    } catch (error) {
        console.error("Error capturing act:", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Nepavyko sugeneruoti akto paveikslėlio."
        });
    } finally {
        root.unmount();
        document.body.removeChild(tempActContainer);
        setFaultToSign(null);
    }
};


  const generatePdfBlob = async (fault: Fault): Promise<Blob | null> => {
    if (!fault.actImageUrl) {
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Akto paveikslėlis nerastas. Pirmiausia turi pasirašyti abi pusės."
        });
        return null;
    }

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(fault.actImageUrl);

        const imgWidth = pdfWidth - 20; 
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        let finalHeight = imgHeight;
        let finalWidth = imgWidth;
        
        if (imgHeight > pdfHeight - 20) {
            finalHeight = pdfHeight - 20;
            finalWidth = (imgProps.width * finalHeight) / imgProps.height;
        }
        
        const x = (pdfWidth - finalWidth) / 2;
        const y = 10;

        pdf.addImage(fault.actImageUrl, 'PNG', x, y, finalWidth, finalHeight);
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
        a.download = `atliktu-darbu-aktas-${fault.customId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllActs = async () => {
    if (!displayedAndSortedFaults) return;
    setIsDownloadingAll(true);
    toast({
        title: "Pradedamas aktų archyvavimas...",
        description: "Tai gali užtrukti kelias akimirkas. Prašome palaukti."
    });

    const zip = new JSZip();
    const faultsToDownload = displayedAndSortedFaults.filter(f => f.status === 'completed' && f.actImageUrl);

    for (const fault of faultsToDownload) {
        const blob = await generatePdfBlob(fault);
        if (blob) {
            zip.file(`atliktu-darbu-aktas-${fault.customId}.pdf`, blob);
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
            description: "Pagal pasirinktus filtrus nerasta pilnai pasirašytų aktų, kuriuos būtų galima atsisiųsti."
        });
    }

    setIsDownloadingAll(false);
  }


  const getWorkerName = (workerId?: string) => {
    if (!workerId || !workers) return "Nepriskirta";
    return workers.find((w) => w.id === workerId)?.name || "Nežinomas";
  };
  
  const getAssignedWorker = (fault: Fault) => {
    if (!workers) return undefined;
    return workers.find((w) => w.id === fault.assignedTo);
  }
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const displayedAndSortedFaults = useMemo(() => {
    if (!faults) return [];
  
    let filteredFaults: Fault[] = [];

    if (view === 'worker') {
        if(user?.uid) {
            filteredFaults = faults.filter(fault => fault.assignedTo === user.uid && fault.status !== 'completed');
        }
    } else { // admin view
        filteredFaults = faults.filter(fault => {
            const statusMatch = statusFilter === 'all' ? true : fault.status === statusFilter;
            
            const dateMatch = dateRange?.from && dateRange.to && fault.createdAt?.toDate
                ? fault.createdAt.toDate() >= dateRange.from && fault.createdAt.toDate() <= dateRange.to
                : true;

            return statusMatch && dateMatch;
        });
    }
  
    return [...filteredFaults].sort((a, b) => {
        if (sortKey === 'updatedAt' || sortKey === 'createdAt') {
          const dateA = a[sortKey]?.toDate ? a[sortKey].toDate().getTime() : 0;
          const dateB = b[sortKey]?.toDate ? b[sortKey].toDate().getTime() : 0;
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (sortKey === 'id') {
            const numA = parseInt(a.customId.replace('FAULT-', ''), 10);
            const numB = parseInt(b.customId.replace('FAULT-', ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                 return sortDirection === 'asc' ? numA - numB : numB - numA;
            }
        }
        
        let valA: string | undefined;
        let valB: string | undefined;
        
        if (sortKey === 'status') {
          valA = statusConfig[a.status].label;
          valB = statusConfig[b.status].label;
        } else if (sortKey === 'assignedTo') {
          valA = a.assignedTo ? getWorkerName(a.assignedTo) : 'Z';
          valB = b.assignedTo ? getWorkerName(b.assignedTo) : 'Z';
        } else if (sortKey === 'type' || sortKey === 'address' || sortKey === 'description') {
          valA = a[sortKey];
          valB = b[sortKey];
        }


        if (valA === undefined || valB === undefined) return 0;
        
        if (sortDirection === 'asc') {
          return valA.localeCompare(valB, 'lt', { numeric: true });
        } else {
          return valB.localeCompare(valA, 'lt', { numeric: true });
        }
      });
  }, [faults, view, user, statusFilter, dateRange, sortKey, sortDirection, workers]);


  const downloadableActsCount = displayedAndSortedFaults.filter(f => f.status === 'completed' && f.actImageUrl).length;
  
  const statusCounts = useMemo(() => ({
    all: faults?.length ?? 0,
    new: faults?.filter(fault => fault.status === 'new').length ?? 0,
    assigned: faults?.filter(fault => fault.status === 'assigned').length ?? 0,
    'in-progress': faults?.filter(fault => fault.status === 'in-progress').length ?? 0,
    completed: faults?.filter(fault => fault.status === 'completed').length ?? 0
  }), [faults]);

  if (faultsLoading || workersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const adminView = (
    <div className="space-y-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(statusConfig) as Status[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card
              key={status}
              isClickable={true}
              onClick={() => setStatusFilter(status)}
              className={cn('ring-2 ring-transparent transition-all', statusFilter === status && config.ringClassName)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {config.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts[status]}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | "all")}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Visi ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="new">Nauji ({statusCounts.new})</TabsTrigger>
          <TabsTrigger value="assigned">Priskirti ({statusCounts.assigned})</TabsTrigger>
          <TabsTrigger value="in-progress">Vykdomi ({statusCounts['in-progress']})</TabsTrigger>
          <TabsTrigger value="completed">Užbaigti ({statusCounts.completed})</TabsTrigger>
        </TabsList>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline">Visi gedimai</CardTitle>
               <Button onClick={() => setIsAddFaultDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registruoti gedimą
                </Button>
            </CardHeader>
            <CardContent>
              {renderTable()}
            </CardContent>
        </Card>
      </Tabs>
      <AddFaultDialog isOpen={isAddFaultDialogOpen} onOpenChange={setIsAddFaultDialogOpen} />
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
              <SortableHeader sortKey="id" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>ID</SortableHeader>
              <SortableHeader sortKey="type" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Tipas</SortableHeader>
              <SortableHeader sortKey="description" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Aprašymas</SortableHeader>
              <SortableHeader sortKey="address" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Adresas</SortableHeader>
              {view === 'worker' && <TableHead>Pranešėjas</TableHead>}
              <SortableHeader sortKey="status" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Būsena</SortableHeader>
              <SortableHeader sortKey="assignedTo" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Priskirta</SortableHeader>
              {view === 'worker' && <TableHead>Keisti būseną</TableHead>}
              <SortableHeader sortKey="updatedAt" handleSort={handleSort} currentSortKey={sortKey} currentSortDirection={sortDirection}>Atnaujinta</SortableHeader>
              <TableHead className="text-right">Veiksmai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedAndSortedFaults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={view === 'worker' ? 10 : 8} className="h-24 text-center">
                  {view === 'worker' ? "Neturite priskirtų užduočių." : "Pagal pasirinktus filtrus gedimų nerasta."}
                </TableCell>
              </TableRow>
            ) : (
              displayedAndSortedFaults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell className="font-medium">{fault.customId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2" title={fault.type}>
                      <FaultTypeIcon type={fault.type} className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{fault.description.substring(0, 40)}{fault.description.length > 40 ? '...' : ''}</span>
                </TableCell>
                <TableCell>{fault.address}</TableCell>
                {view === 'worker' && <TableCell>{fault.reporterName}</TableCell>}
                <TableCell>
                  <Badge variant={statusConfig[fault.status].color} className={cn("text-xs font-semibold", statusConfig[fault.status].className)}>
                    {statusConfig[fault.status].label}
                  </Badge>
                </TableCell>
                <TableCell>{getWorkerName(fault.assignedTo)}</TableCell>
                {view === 'worker' && (
                    <TableCell>
                        <div className="flex flex-col gap-2">
                        {fault.status === 'assigned' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(fault.id, 'in-progress')} disabled={isUpdating === fault.id}>
                                {isUpdating === fault.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                                Pradėti
                            </Button>
                        )}
                        {fault.status === 'in-progress' && (
                           <>
                                <Button size="sm" onClick={() => setFaultToSign({fault: fault, type: 'worker'})} disabled={!!fault.workerSignature || isUpdating === fault.id}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Darbuotojo parašas
                                </Button>
                                <Button size="sm" onClick={() => setFaultToSign({fault: fault, type: 'customer'})} disabled={!fault.workerSignature || !!fault.customerSignature || isUpdating === fault.id}>
                                     <User className="mr-2 h-4 w-4" />
                                     Užsakovo parašas
                                </Button>
                           </>
                        )}
                        </div>
                    </TableCell>
                )}
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
                       {view === 'admin' && (
                         <>
                            {fault.status === 'completed' && (
                                <DropdownMenuItem onClick={() => openNotificationEditor(fault, 'Užbaigtas')}>
                                    <Send className="mr-2 h-4 w-4" />
                                    <span>Siųsti atsakymą</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                disabled={fault.status !== 'in-progress' || !!fault.workerSignature}
                                onClick={() => setFaultToSign({fault: fault, type: 'worker'})}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Darbuotojo parašas</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={!fault.workerSignature || !!fault.customerSignature || fault.status !== 'in-progress'}
                                onClick={() => setFaultToSign({fault: fault, type: 'customer'})}
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>Užsakovo parašas</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadAct(fault)} disabled={!fault.actImageUrl}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Atsisiųsti aktą</span>
                            </DropdownMenuItem>
                         </>
                      )}
                      <DropdownMenuSeparator />
                      {view === "admin" && workers && (
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
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger disabled={isUpdating === fault.id || fault.status === 'completed'}>
                                  <Wrench className="mr-2 h-4 w-4" />
                                  <span>Keisti būseną</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {(Object.keys(statusConfig) as Status[])
                                    .filter(s => s !== fault.status && s !== 'completed')
                                    .map(status => (
                                      <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(fault.id, status)}>
                                          {statusConfig[status].label}
                                      </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            {fault.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(fault.id, 'completed')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Užbaigti darbą</span>
                                </DropdownMenuItem>
                            )}
                          </>
                      )}
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
                <DialogTitle className="font-headline">Gedimo ID: {selectedFault.customId}</DialogTitle>
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
                         <Button variant="outline" size="sm" asChild>
                            <Link href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedFault.address)}`} target="_blank">
                                <Map className="mr-2 h-4 w-4" /> Rodyti žemėlapyje
                            </Link>
                         </Button>
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

                {selectedFault.actImageUrl && (
                  <div className="space-y-2 pt-4">
                    <h3 className="font-semibold">Atliktų darbų aktas:</h3>
                     <div className="rounded-md border bg-gray-100 dark:bg-gray-800 p-4">
                        <img src={selectedFault.actImageUrl} alt="Pasirašytas aktas" />
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
                  {faultToSign.type === 'worker' 
                    ? "Darbuotojas turi pasirašyti žemiau." 
                    : "Peržiūrėkite atliktus darbus ir pasirašykite žemiau."}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6 text-sm">
                <div className="border rounded-md">
                   <div ref={actTemplateRef}>
                       <ActTemplate 
                        fault={faultToSign.fault} 
                        assignedWorker={getAssignedWorker(faultToSign.fault)}
                        workerSignatureDataUrl={faultToSign.type === 'customer' ? faultToSign.fault.workerSignature : undefined}
                       />
                   </div>
                </div>
                <div>
                   <p className="text-center font-medium mb-2">
                        {faultToSign.type === 'worker' ? 'Vykdytojo parašas:' : 'Užsakovo parašas:'}
                    </p>
                   <SignaturePad 
                    onSave={(signatureDataUrl) => {
                        if (faultToSign.type === 'worker') {
                            handleSaveWorkerSignature(faultToSign.fault.id, signatureDataUrl);
                        } else {
                            handleSaveCustomerSignature(faultToSign.fault.id, signatureDataUrl);
                        }
                    }} 
                   />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

       <Dialog open={!!notificationContent} onOpenChange={(open) => !open && setNotificationContent(null)}>
        <DialogContent className="sm:max-w-xl">
           {notificationContent && (
            <form onSubmit={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Pranešimo siuntimas</DialogTitle>
                    <DialogDescription>
                        Peržiūrėkite ir redaguokite pranešimo turinį prieš siunčiant.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="email-subject">El. laiško tema</Label>
                        <Input 
                            id="email-subject" 
                            value={notificationContent.subject} 
                            onChange={(e) => setNotificationContent(prev => prev ? {...prev, subject: e.target.value} : null)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email-body">El. laiško turinys</Label>
                        <Textarea 
                            id="email-body" 
                            value={notificationContent.emailBody}
                            onChange={(e) => setNotificationContent(prev => prev ? {...prev, emailBody: e.target.value} : null)}
                            className="h-32"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sms-body">SMS žinutės turinys</Label>
                        <Textarea 
                            id="sms-body" 
                            value={notificationContent.smsBody} 
                            onChange={(e) => setNotificationContent(prev => prev ? {...prev, smsBody: e.target.value} : null)}
                            className="h-20"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setNotificationContent(null)}>Atšaukti</Button>
                     <div className="flex gap-2">
                        <Button asChild>
                           <a href={`mailto:${notificationContent.fault.reporterEmail}?subject=${encodeURIComponent(notificationContent.subject)}&body=${encodeURIComponent(notificationContent.emailBody)}`}>
                            <Send className="mr-2 h-4 w-4" /> Siųsti el. laišką
                           </a>
                        </Button>
                        <Button asChild>
                            <a href={`sms:${notificationContent.fault.reporterPhone}?body=${encodeURIComponent(notificationContent.smsBody)}`}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Siųsti SMS
                            </a>
                        </Button>
                    </div>
                </DialogFooter>
            </form>
           )}
        </DialogContent>
      </Dialog>
    </>
  );
}
