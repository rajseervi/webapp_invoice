import React, { useState } from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import {
  Add as AddIcon,
  CreateNewFolder as NewCategoryIcon,
} from '@mui/icons-material';

interface CategoryActionsProps {
  onAddCategory: () => void;
  onExport: () => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({
  onAddCategory,
  onExport,
}) => {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <AddIcon />,
      name: 'Quick Add',
      onClick: onAddCategory,
    },
    {
      icon: <NewCategoryIcon />,
      name: 'New Category Wizard',
      onClick: () => {
        window.location.href = '/categories/new';
      },
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Category Actions"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        '& .MuiFab-primary': {
          backgroundColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.dark',
          }
        }
      }}
      icon={<SpeedDialIcon />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => {
            action.onClick();
            setOpen(false);
          }}
          sx={{
            '& .MuiSpeedDialAction-staticTooltipLabel': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }
          }}
        />
      ))}
    </SpeedDial>
  );
};

export default CategoryActions;