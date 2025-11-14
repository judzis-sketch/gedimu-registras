"use client";

import { useState, useEffect } from "react";
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
import { MoreHorizontal, User, Clock, Info, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fault, Worker, Status } from "@/lib/types";
import { FaultTypeIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useFaults } from "@/context/faults-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const handleAssignWorker = (faultId: string, workerId: string) => {
    setFaults((prevFaults) =>
      prevFaults.map((fault) =>
        fault.id === faultId
          ? { ...fault, assignedTo: workerId, status: "assigned", updatedAt: new Date() }
          : fault
      )
    );
    const workerName = initialWorkers.find(w => w.id === workerId)?.name;
    toast({
      title: "Specialistas priskirtas",
      description: `Gedimas ${faultId} priskirtas ${workerName}.`,
    });
  };

  const handleUpdateStatus = (faultId: string, status: Status) => {
    setFaults((prevFaults) =>
      prevFaults.map((fault) =>
        fault.id === faultId ? { ...fault, status: status, updatedAt: new Date() } : fault
      )
    );
     toast({
      title: "Būsena atnaujinta",
      description: `Gedimo ${faultId} būsena pakeista į "${statusConfig[status].label}".`,
    });
  };

  const getWorkerName = (workerId?: string) => {
    if (!workerId) return <span className="text-muted-foreground">Nepriskirta</span>;
    return initialWorkers.find((w) => w.id === workerId)?.name || "Nežinomas";
  };
  
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
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Atidaryti meniu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Veiksmai</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedFault(fault)}>
                          <Info className="mr-2 h-4 w-4" />
                          Peržiūrėti informaciją
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {view === "admin" && (
                          <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
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
                      )}
                        {view === "worker" && fault.status !== 'completed' && (
                          <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Keisti būseną</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(fault.id, "in-progress")}>
                                  Vykdomas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(fault.id, "completed")}>
                                  Užbaigtas
                              </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
                      <p className="text-muted-foreground text-sm">{selectedFault.description}</p>
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
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            Sukurta: <FormattedDate date={selectedFault.createdAt} />
                        </span>
                      </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
