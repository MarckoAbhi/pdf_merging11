import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    document.title = "404 – Page Not Found";
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6">
      <section
        className="mx-auto max-w-md text-center"
        aria-labelledby="not-found-title"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Error 404
        </p>

        <h1
          id="not-found-title"
          className="mb-4 text-4xl font-bold tracking-tight"
        >
          Page not found
        </h1>

        <p className="mb-8 text-base text-muted-foreground">
          Sorry, the page you’re looking for doesn’t exist or may have been
          moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Go back home
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
