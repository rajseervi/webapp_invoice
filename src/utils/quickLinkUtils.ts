import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Normalizes a URL for comparison by:
 * - Converting to lowercase
 * - Removing protocol (http://, https://)
 * - Removing www. prefix
 * - Removing trailing slashes
 * - Trimming whitespace
 */
const normalizeUrl = (url: string): string => {
  let normalized = url.toLowerCase().trim();
  
  // Remove protocol (http://, https://)
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove www. prefix
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash
  normalized = normalized.endsWith('/') 
    ? normalized.slice(0, -1) 
    : normalized;
    
  return normalized;
};

interface QuickLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  order?: number;
  createdAt?: any;
}

/**
 * Removes duplicate quick links based on URL
 * Keeps the most complete entry when duplicates are found
 */
export const removeQuickLinkDuplicates = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Fetch all quick links
    const quickLinksCollection = collection(db, 'quickLinks');
    const quickLinksSnapshot = await getDocs(quickLinksCollection);
    
    // Create a map to store quick links by URL (normalized)
    const linkMap = new Map<string, QuickLink[]>();
    
    // Group quick links by normalized URL
    quickLinksSnapshot.docs.forEach(doc => {
      const data = doc.data() as QuickLink;
      const link = { ...data, id: doc.id };
      
      // Normalize URL for consistent comparison
      const normalizedUrl = normalizeUrl(link.url);
      
      if (!linkMap.has(normalizedUrl)) {
        linkMap.set(normalizedUrl, [link]);
      } else {
        linkMap.get(normalizedUrl)?.push(link);
      }
    });
    
    let deletedCount = 0;
    
    // Process each group of quick links
    for (const [url, links] of linkMap.entries()) {
      if (links.length > 1) {
        console.log(`Found ${links.length} duplicates for quick link: ${url}`);
        
        // Sort links by completeness of information and recency
        const sortedLinks = links.sort((a, b) => {
          // Score based on completeness
          const aScore = (a.title ? 1 : 0) + 
                        (a.category ? 1 : 0) + 
                        (a.order !== undefined ? 1 : 0);
          const bScore = (b.title ? 1 : 0) + 
                        (b.category ? 1 : 0) + 
                        (b.order !== undefined ? 1 : 0);
          
          // If completeness is the same, prefer newer links
          if (aScore === bScore && a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          
          return bScore - aScore;
        });
        
        // Keep the first link (most complete/recent) and delete the rest
        for (let i = 1; i < sortedLinks.length; i++) {
          console.log(`Deleting duplicate quick link: ${sortedLinks[i].title || 'Untitled'} (ID: ${sortedLinks[i].id})`);
          const linkRef = doc(db, 'quickLinks', sortedLinks[i].id);
          await deleteDoc(linkRef);
          deletedCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Successfully removed ${deletedCount} duplicate quick links.`
    };
  } catch (error) {
    console.error('Error removing duplicate quick links:', error);
    // Provide more detailed error message
    const errorMessage = error instanceof Error 
      ? `Error: ${error.message}` 
      : 'Unknown error occurred';
    
    return {
      success: false,
      message: `Failed to remove duplicate quick links: ${errorMessage}`
    };
  }
};

/**
 * Finds and returns duplicate quick links without deleting them
 */
export const findQuickLinkDuplicates = async (): Promise<{
  duplicates: { url: string, links: QuickLink[] }[],
  count: number
}> => {
  try {
    // Fetch all quick links
    const quickLinksCollection = collection(db, 'quickLinks');
    const quickLinksSnapshot = await getDocs(quickLinksCollection);
    
    // Create a map to store quick links by URL (normalized)
    const linkMap = new Map<string, QuickLink[]>();
    
    // Group quick links by normalized URL
    quickLinksSnapshot.docs.forEach(doc => {
      const data = doc.data() as QuickLink;
      const link = { ...data, id: doc.id };
      
      // Normalize URL for consistent comparison
      const normalizedUrl = normalizeUrl(link.url);
      
      if (!linkMap.has(normalizedUrl)) {
        linkMap.set(normalizedUrl, [link]);
      } else {
        linkMap.get(normalizedUrl)?.push(link);
      }
    });
    
    // Filter to only include URLs with duplicates
    const duplicates: { url: string, links: QuickLink[] }[] = [];
    let totalDuplicates = 0;
    
    for (const [url, links] of linkMap.entries()) {
      if (links.length > 1) {
        duplicates.push({ url, links });
        totalDuplicates += links.length - 1; // Count all but one as duplicates
      }
    }
    
    return {
      duplicates,
      count: totalDuplicates
    };
  } catch (error) {
    console.error('Error finding duplicate quick links:', error);
    return {
      duplicates: [],
      count: 0
    };
  }
};