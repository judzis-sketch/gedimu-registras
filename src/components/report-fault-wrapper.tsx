"use client";

import { FaultsProvider } from "@/context/faults-context";
import { ReportFaultForm } from "./report-fault-form";

export function ReportFaultWrapper() {
    return (
        <FaultsProvider>
            <ReportFaultForm />
        </FaultsProvider>
    )
}
