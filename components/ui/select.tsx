// filepath: components/ui/select.tsx
import * as React from "react";
import { useState } from "react";

export function Select({ value, onValueChange, children }: { value: string, onValueChange: (v: string) => void, children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value)}
      className="border rounded px-2 py-1 w-full"
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return (
    <div className="border rounded px-3 py-2 bg-white cursor-pointer w-full">
      {children}
    </div>
  );
}

export function SelectValue({ value, placeholder }: { value?: string; placeholder: string }) {
  return (
    <span className="text-gray-700">{value || placeholder}</span>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 border rounded bg-white shadow w-full z-10">
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}


// import React, { useState } from "react";

// export interface SelectProps {
//   value: string;
//   onValueChange: (value: string) => void;
//   children: React.ReactNode;
// }

// export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="relative">
//       {React.Children.map(children, child =>
//         React.cloneElement(child as React.ReactElement<any>, {
//           value,
//           onValueChange,
//           open,
//           setOpen,
//         })
//       )}
//     </div>
//   );
// };

// export const SelectTrigger: React.FC<any> = ({ value, setOpen, children }) => (
//   <button
//     type="button"
//     className="border rounded px-3 py-2 w-full text-left bg-white"
//     onClick={() => setOpen((prev: boolean) => !prev)}
//   >
//     {children}
//   </button>
// );

// export const SelectValue: React.FC<any> = ({ value, placeholder }) => (
//   <span className="text-gray-700">{value || placeholder}</span>
// );

// export const SelectContent: React.FC<any> = ({ open, children }) =>
//   open ? (
//     <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
//       {children}
//     </div>
//   ) : null;

// export const SelectItem: React.FC<any> = ({ value, onValueChange, children, setOpen }) => (
//   <div
//     className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
//     onClick={() => {
//       onValueChange(value);
//       setOpen(false);
//     }}
//   >
//     {children}
//   </div>
// );