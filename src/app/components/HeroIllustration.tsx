import React from 'react';
import { motion } from 'framer-motion';
import { Box, useTheme } from '@mui/material';

const HeroIllustration = () => {
  const theme = useTheme();

  return (
    <Box
      component={motion.svg}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        width: '100%',
        height: '100%',
        maxWidth: 400,
        filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.2))',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.palette.primary.light} stopOpacity={0.8} />
          <stop offset="100%" stopColor={theme.palette.secondary.light} stopOpacity={0.6} />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <motion.rect
        x="50"
        y="50"
        width="300"
        height="300"
        rx="20"
        fill="url(#heroGrad)"
        filter="url(#glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />

      {/* Enhanced data lines with animations */}
      {[0, 1, 2].map((i) => (
        <motion.g 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
        >
          <rect x="80" y={100 + i * 60} width="240" height="30" rx="4" fill="rgba(255, 255, 255, 0.15)" />
          <motion.rect 
            x="85" 
            y={110 + i * 60} 
            width="150" 
            height="10" 
            rx="2" 
            fill="rgba(255, 255, 255, 0.4)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
          />
        </motion.g>
      ))}
      
      {/* Floating circles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={`circle-${i}`}
          cx={100 + i * 70}
          cy={300}
          r={5 + i * 2}
          fill="rgba(255, 255, 255, 0.2)"
          initial={{ y: 0 }}
          animate={{ y: [0, -15, 0] }}
          transition={{ 
            duration: 3 + i * 0.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </Box>
  );
};

export default HeroIllustration;