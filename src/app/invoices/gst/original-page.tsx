import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OriginalPageComponent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect GST invoice list to regular invoice list
    router.replace('/invoices/regular');
  }, [router]);

  return null;
}