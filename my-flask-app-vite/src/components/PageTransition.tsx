<<<<<<< HEAD
=======
<<<<<<< HEAD
import React from 'react';

interface PageTransitionProps {
  show: boolean;
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ show, children }) => (
  <div className="relative">
=======
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
interface PageTransitionProps {
  show: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({ show }) => {
  return (
<<<<<<< HEAD
=======
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
    <div
      className={`fixed inset-0 bg-blue-600 z-50 transition-transform duration-500 ease-in-out ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    />
<<<<<<< HEAD
  );
};
=======
<<<<<<< HEAD
    {children}
  </div>
  );
=======
  );
};
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea

export default PageTransition; 