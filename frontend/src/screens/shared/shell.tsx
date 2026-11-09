import { createContext, useContext, type ReactNode } from 'react';

const ShellContext = createContext(false);

export function useConShell(): boolean {
  return useContext(ShellContext);
}

export interface ProveedorShellProps {
  conShell: boolean;
  children: ReactNode;
}

export function ProveedorShell({ conShell, children }: ProveedorShellProps) {
  return <ShellContext.Provider value={conShell}>{children}</ShellContext.Provider>;
}
