interface PageTransitionProps {
  show: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({ show }) => {
  return (
    <div
      className={`fixed inset-0 bg-blue-600 z-50 transition-transform duration-500 ease-in-out ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    />
  );
};

export default PageTransition; 