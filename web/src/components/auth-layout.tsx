import { Logo } from "./shell";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 md:items-center md:pt-0">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="text-muted mt-2 mb-8">{description}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
