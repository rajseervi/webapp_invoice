"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GstOnlyInvoiceRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect GST-only invoice list to regular invoice list
    router.replace('/invoices/regular');
  }, [router]);

  return null;
}