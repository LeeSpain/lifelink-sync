import { toast } from '@/hooks/use-toast';

export interface NetworkError {
  status: number;
  message: string;
  url?: string;
}

export const handleNetworkError = (error: any, context: string = 'request') => {
  console.error(`Network error in ${context}:`, error);
  
  if (error?.status === 404) {
    toast({
      title: "Resource Not Found",
      description: `The requested ${context} could not be found. Please try again later.`,
      variant: "destructive"
    });
    return;
  }
  
  if (error?.status >= 500) {
    toast({
      title: "Server Error",
      description: `A server error occurred. Please try again in a few moments.`,
      variant: "destructive"
    });
    return;
  }
  
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    toast({
      title: "Request Timeout",
      description: `The ${context} took too long to respond. Please check your connection.`,
      variant: "destructive"
    });
    return;
  }
  
  // Generic network error
  toast({
    title: "Connection Error",
    description: `Failed to connect for ${context}. Please check your internet connection.`,
    variant: "destructive"
  });
};

export const withNetworkErrorHandling = async <T>(
  fn: () => Promise<T>,
  context: string = 'operation'
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleNetworkError(error, context);
    return null;
  }
};