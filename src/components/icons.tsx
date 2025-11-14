import type { SVGProps } from "react";
import { Bolt, Droplets, Paintbrush, Wrench } from "lucide-react";
import { FaultType } from "@/lib/types";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      <path d="m18 11-2.5 2.5" />
      <path d="m13.5 16.5 2.5-2.5" />
    </svg>
  );
}

const faultTypeIcons: Record<FaultType, React.ElementType> = {
  electricity: Bolt,
  plumbing: Droplets,
  renovation: Paintbrush,
  general: Wrench,
};

export const FaultTypeIcon = ({ type, ...props }: { type: FaultType } & SVGProps<SVGSVGElement>) => {
  const Icon = faultTypeIcons[type];
  return <Icon {...props} />;
};
