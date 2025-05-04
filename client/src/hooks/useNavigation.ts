/**
 * Simple navigation hook that re-exports React Router's hooks
 * This is a replacement for the useCustomNavigate hook
 */
import { useNavigate, useLocation, NavigateOptions } from 'react-router-dom';

/**
 * Hook for navigation functions
 * @returns Navigation functions
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigate to a specific route
   * @param to - The path to navigate to
   * @param options - Navigation options
   */
  const goTo = (to: string, options?: NavigateOptions) => {
    navigate(to, options);
  };

  /**
   * Navigate back
   */
  const goBack = () => {
    navigate(-1);
  };

  /**
   * Navigate to the home page
   */
  const goHome = () => {
    navigate('/');
  };

  return {
    navigate,
    goTo,
    goBack,
    goHome,
    location
  };
};

export default useNavigation;
