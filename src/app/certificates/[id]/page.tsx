import { CertificateDetail } from '@/components/certificates/certificate-detail';

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <CertificateDetail certificateId={id} />
      </div>
    </div>
  );
}