import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main
      className="-mt-[88px] pt-[88px] relative min-h-screen"
      style={{
        background:
          "linear-gradient(90deg, #F2FCFF 0%, #FFFFFF 20%, #FFFFFF 80%, #F2FCFF 100%)",
      }}
    >
      <div className="mx-auto max-w-[420px] px-6 min-h-[calc(100vh-88px)] flex items-center">
        <LoginForm className="w-full" />
      </div>
    </main>
  );
}


