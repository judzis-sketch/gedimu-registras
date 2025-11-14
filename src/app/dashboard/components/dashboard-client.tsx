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
import { MoreHorizontal, User, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fault, Worker, Status } from "@/lib/types";
import { FaultTypeIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";

interface DashboardClientProps {
  initialFaults: Fault[];
  initialWorkers: Worker[];
  view: "admin" | "worker";
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

const FormattedDate = ({ date }: { date: Date }) => {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        setFormattedDate(format(date, 'yyyy-MM-dd HH:mm', { locale: lt }));
    }, [date]);

    return <>{formattedDate}</>;
};

export function DashboardClient({
  initialFaults,
  initialWorkers,
  view,
}: DashboardClientProps) {
  const [faults, setFaults] = useState<Fault[]>(initialFaults.map(f => ({...f, createdAt: new Date(f.createdAt), updatedAt: new Date(f.updatedAt)})));
  const { toast } = useToast();

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
  
  return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">
            {view === "admin" ? "Visi gedimai" : "Mano aktyvios užduotys"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              {faults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {view === 'worker' ? "Neturite priskirtų užduočių." : "Nėra registruotų gedimų."}
                  </TableCell>
                </TableRow>
              ) : (
                faults.map((fault) => (
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
                        <DropdownMenuItem>Peržiūrėti informaciją</DropdownMenuItem>
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
                         {view === "worker" && (
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
        </CardContent>
      </Card>
  );
}
