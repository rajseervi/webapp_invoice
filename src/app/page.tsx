'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from './components/landing/Header';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import Demo from './components/landing/Demo';
import Testimonials from './components/landing/Testimonials';
import CTA from './components/landing/CTA';
import Footer from './components/landing/Footer';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, userRole, logout } = useAuth();
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  const handleLogout = async () => {
    const redirectUrl = await logout();
    router.push(redirectUrl);
  };

  const handleDashboardRedirect = () => {
    router.push('/admin/dashboard');
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${sectionId}`);
      } else {
        window.location.hash = sectionId;
      }
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      let currentSection: string | null = null;
      const navItems = ['features', 'demo', 'testimonials', 'cta', 'contact'];
      navItems.forEach((item) => {
        const sectionElement = document.getElementById(item);
        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            currentSection = item;
          }
        }
      });

      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        isUserLoggedIn={!!currentUser}
        userRole={userRole}
        onLogout={handleLogout}
        onDashboardRedirect={handleDashboardRedirect}
        activeSection={activeSection}
        scrollToSection={scrollToSection}
      />
      <Hero />
      <Features />
      <Demo />
      <Testimonials />
      <CTA />
      <Footer />
    </Box>
  );
}
