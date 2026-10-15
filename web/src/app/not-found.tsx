import { Logo } from "@/components/shell";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="font-display text-primary text-7xl font-extrabold">404</p>
        <h1 className="mt-4 text-3xl font-bold">This page doesn&apos;t exist</h1>
        <p className="text-muted mt-2 max-w-sm">The link may be broken, or the page may have been removed.</p>
        <ButtonLink href="/" className="mt-8">
          Go to the home page
        </ButtonLink>
      </main>
    </div>
  );
}
