Analytics#!/bin/bash

# Make backup of original files
cp /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/DashboardLayout.tsx /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/DashboardLayout.original.tsx
cp /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/ImprovedNavigation.tsx /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/ImprovedNavigation.original.tsx

# Replace with fixed versions
cp /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/DashboardLayout.fixed.tsx /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/DashboardLayout.tsx
cp /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/ImprovedNavigation.fixed.tsx /Users/prakashseervi/Desktop/mastermind/src/components/DashboardLayout/ImprovedNavigation.tsx

echo "Responsive layout files have been updated!"