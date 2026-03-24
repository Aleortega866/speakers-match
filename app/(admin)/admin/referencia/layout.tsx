export default function AdminReferenciaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="space-y-6 font-body text-black">{children}</div>;
}
