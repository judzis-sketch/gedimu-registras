"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current) {
        const signature = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
        onSave(signature);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="w-full h-48 rounded-md border border-input bg-background">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: "w-full h-full" }}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={clear}>
          Išvalyti
        </Button>
        <Button onClick={save}>Išsaugoti parašą</Button>
      </div>
    </div>
  );
}
