"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GstInvoiceRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect GST invoice creation to regular invoice creation
    router.replace('/invoices/new');
  }, [router]);

  return null;
}