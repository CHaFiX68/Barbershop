type Props = {
  children: React.ReactNode;
};

export default function AuthCard({ children }: Props) {
  return (
    <div className="w-full max-w-md mx-auto bg-white border border-[var(--color-line)] rounded-[16px] p-8 sm:p-10">
      {children}
    </div>
  );
}
