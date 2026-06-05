import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm space-y-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Síða fannst ekki</h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Úps — þessi síða er ekki til. Hún gæti hafa flutt eða slóðin gæti vera röng.
          </p>
        </div>
        <Button asChild className="h-12 px-6">
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Fara á yfirlit
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
