import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { Building2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  if (session) return <Navigate to="/" replace />;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      sonnerToast.error("Sláðu inn netfangið þitt");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      sonnerToast.success("Endurstillingartengill sendur á netfangið þitt");
      setShowForgotPassword(false);
    } catch (error: any) {
      sonnerToast.error(`Villa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Nýskráning tókst!",
          description: "Athugaðu tölvupóstinn þinn til að staðfesta aðganginn.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Villa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const authCard = (content: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center aurora-bg px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-heading font-bold text-foreground tracking-tight">Húsfélagið</span>
        </div>
        <Card className="backdrop-blur-2xl">
          {content}
        </Card>
      </div>
    </div>
  );

  if (showForgotPassword) {
    return authCard(
      <>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Gleymt lykilorð</CardTitle>
          <CardDescription>
            Sláðu inn netfangið þitt og við sendum þér endurstillingartengil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Netfang</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jon@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Augnablik..." : "Senda endurstillingartengil"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Til baka í innskráningu
            </button>
          </div>
        </CardContent>
      </>
    );
  }

  return authCard(
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">
          {isLogin ? "Velkomin/n aftur" : "Búðu til aðgang"}
        </CardTitle>
        <CardDescription>
          {isLogin ? "Skráðu þig inn á aðganginn þinn" : "Búðu til nýjan aðgang"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Fullt nafn</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jón Jónsson"
                required={!isLogin}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Netfang</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jon@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Lykilorð</Label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Gleymt lykilorð?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Augnablik..." : isLogin ? "Skrá inn" : "Nýskrá"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {isLogin ? "Á ekki aðgang? Nýskrá" : "Á nú þegar aðgang? Skrá inn"}
          </button>
        </div>
      </CardContent>
    </>
  );
};

export default Auth;
