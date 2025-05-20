import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import { getCompanyInfo } from '@/services/settingsService';
import { CompanyInfo } from '@/types/company';

interface CompanyInfoDisplayProps {
  variant?: 'header' | 'invoice' | 'compact';
  showLogo?: boolean;
}

const CompanyInfoDisplay: React.FC<CompanyInfoDisplayProps> = ({ 
  variant = 'header',
  showLogo = true
}) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
      } catch (error) {
        console.error('Error loading company info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyInfo();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showLogo && <Skeleton variant="circular" width={40} height={40} />}
        <Box>
          <Skeleton variant="text" width={150} />
          <Skeleton variant="text" width={100} />
        </Box>
      </Box>
    );
  }

  if (!companyInfo) {
    return (
      <Typography variant="body2" color="text.secondary">
        Company information not available
      </Typography>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showLogo && companyInfo.logo && (
          <Avatar 
            src={companyInfo.logo} 
            alt={companyInfo.name}
            sx={{ width: 24, height: 24 }}
          />
        )}
        <Typography variant="body2" fontWeight="medium">
          {companyInfo.name}
        </Typography>
      </Box>
    );
  }

  if (variant === 'invoice') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {showLogo && companyInfo.logo && (
            <Avatar 
              src={companyInfo.logo} 
              alt={companyInfo.name}
              sx={{ width: 60, height: 60 }}
            />
          )}
          <Typography variant="h6" fontWeight="bold">
            {companyInfo.name}
          </Typography>
        </Box>
        
        {companyInfo.address && (
          <Typography variant="body2" paragraph>
            {companyInfo.address}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {companyInfo.phone && (
            <Typography variant="body2">
              Phone: {companyInfo.phone}
            </Typography>
          )}
          
          {companyInfo.email && (
            <Typography variant="body2">
              Email: {companyInfo.email}
            </Typography>
          )}
          
          {companyInfo.website && (
            <Typography variant="body2">
              Website: {companyInfo.website}
            </Typography>
          )}
          
          {companyInfo.gstin && (
            <Typography variant="body2">
              GSTIN: {companyInfo.gstin}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Default header variant
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {showLogo && companyInfo.logo && (
        <Avatar 
          src={companyInfo.logo} 
          alt={companyInfo.name}
          sx={{ width: 40, height: 40 }}
        />
      )}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          {companyInfo.name}
        </Typography>
        {companyInfo.gstin && (
          <Typography variant="caption" color="text.secondary">
            GSTIN: {companyInfo.gstin}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CompanyInfoDisplay;