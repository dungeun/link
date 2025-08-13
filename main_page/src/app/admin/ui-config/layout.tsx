import AdminLayout from '@/components/admin/AdminLayout'

export default function UIConfigLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}